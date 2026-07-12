import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { createId } from '../lib/ids';
import {
  APP_FIELD_OPTIONS,
  getDefaultMappingForPreset,
} from '../lib/externalForms/fieldMapping';
import {
  buildWebhookUrl,
  detectExternalFields,
  generateSecretKey,
  normalizeSubmission,
} from '../lib/externalForms/connectionWebhook';
import { previewActivityFromSubmission } from '../lib/externalForms/processSubmission';
import {
  registerExternalFormConnection,
  sendTestWebhook,
} from '../lib/externalForms/clientApi';
import { buildFormsAppMockPayload } from '../lib/externalForms/mockSubmission';
import {
  mergeSuggestedWithPreset,
  suggestFieldMappingFromLabels,
} from '../lib/externalForms/suggestFieldMapping';
import { refreshFromCloudIfNewer } from '../lib/cloudSync';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import type {
  ExternalFormActivityType,
  ExternalFormFieldMapping,
  ExternalFormProviderId,
} from '../types/externalForms';
import {
  EXTERNAL_FORM_ACTIVITY_LABELS,
  EXTERNAL_FORM_PROVIDER_LABELS,
} from '../types/externalForms';

const PROVIDERS: ExternalFormProviderId[] = [
  'forms_app',
  'google_forms',
  'typeform',
  'jotform',
  'tally',
  'custom',
];

const ACTIVITY_TYPES: ExternalFormActivityType[] = ['event', 'card', 'program', 'course'];

function registerErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'לא ניתן להגיע לשרת — ודאי שהאפליקציה פרוסה ב-Vercel';
    }
    return error.message;
  }
  return 'שגיאה בחיבור — נסו שוב';
}

export function ExternalFormWizardPage() {
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business)!;
  const user = useAppStore((s) => s.user)!;
  const upsertExternalFormConnection = useAppStore((s) => s.upsertExternalFormConnection);
  const activateExternalFormConnection = useAppStore((s) => s.activateExternalFormConnection);

  const presetMapping = useMemo(
    () => getDefaultMappingForPreset(business.presetId),
    [business.presetId],
  );

  const [step, setStep] = useState(1);
  const [connectionId] = useState(() => createId());
  const [secretKey] = useState(() => generateSecretKey());
  const [provider, setProvider] = useState<ExternalFormProviderId>('forms_app');
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [activityType, setActivityType] = useState<ExternalFormActivityType>('event');
  const [fieldMapping, setFieldMapping] = useState<ExternalFormFieldMapping[]>(presetMapping);
  const [testJson, setTestJson] = useState('');
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [testMsgKind, setTestMsgKind] = useState<'ok' | 'err' | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverSaved, setServerSaved] = useState(false);
  const [mappingAutoSuggested, setMappingAutoSuggested] = useState(false);
  const [detectedFieldLabels, setDetectedFieldLabels] = useState<string[]>([]);

  const cloudReady = isSupabaseConfigured();

  const webhookUrl = useMemo(
    () => buildWebhookUrl(connectionId, secretKey),
    [connectionId, secretKey],
  );

  const draftConnection = useMemo(
    () => ({
      id: connectionId,
      businessId: business.id,
      ownerId: user.id,
      provider,
      formName: formName.trim() || 'טופס חדש',
      formUrl: formUrl.trim() || undefined,
      webhookUrl,
      secretKey,
      activityType,
      isActive: false,
      fieldMapping,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submissionCount: 0,
    }),
    [
      connectionId,
      business.id,
      user.id,
      provider,
      formName,
      formUrl,
      webhookUrl,
      secretKey,
      activityType,
      fieldMapping,
    ],
  );

  const parsedTest = useMemo(() => {
    if (!testJson.trim()) return null;
    try {
      return JSON.parse(testJson) as unknown;
    } catch {
      return null;
    }
  }, [testJson]);

  const normalizedPreview = useMemo(() => {
    if (!parsedTest) return null;
    try {
      return normalizeSubmission(draftConnection, parsedTest);
    } catch {
      return null;
    }
  }, [parsedTest, draftConnection]);

  const activityPreview = useMemo(() => {
    if (!normalizedPreview) return null;
    return previewActivityFromSubmission(draftConnection, normalizedPreview);
  }, [normalizedPreview, draftConnection]);

  const detectedFields = useMemo(() => {
    if (detectedFieldLabels.length > 0) return detectedFieldLabels;
    if (!parsedTest) return [];
    return detectExternalFields(parsedTest, provider);
  }, [parsedTest, provider, detectedFieldLabels]);

  const showMessage = (text: string, kind: 'ok' | 'err') => {
    setTestMsg(text);
    setTestMsgKind(kind);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showMessage('הועתק!', 'ok');
      setTimeout(() => {
        setTestMsg(null);
        setTestMsgKind(null);
      }, 2000);
    } catch {
      showMessage('לא ניתן להעתיק', 'err');
    }
  };

  const ensureCloudSession = async (): Promise<boolean> => {
    if (!cloudReady) {
      showMessage('חיבור טפסים דורש התחברות עם אימייל וסיסמה (Supabase)', 'err');
      return false;
    }
    try {
      const { data } = await getSupabase().auth.getSession();
      if (!data.session?.user?.id) {
        showMessage('יש להתחבר עם אימייל וסיסמה לפני חיבור טופס', 'err');
        return false;
      }
      if (data.session.user.id !== user.id) {
        showMessage('זוהה חשבון שונה — התנתקי והתחברי מחדש', 'err');
        return false;
      }
    } catch {
      showMessage('לא ניתן לוודא התחברות לענן', 'err');
      return false;
    }
    return true;
  };

  const saveConnectionToServer = async (active: boolean): Promise<boolean> => {
    if (!(await ensureCloudSession())) return false;
    setBusy(true);
    setTestMsg(null);
    setTestMsgKind(null);
    const connection = { ...draftConnection, isActive: active, fieldMapping };
    try {
      upsertExternalFormConnection(connection);
      await registerExternalFormConnection(connection);
      setServerSaved(true);
      return true;
    } catch (e) {
      showMessage(registerErrorMessage(e), 'err');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const applySuggestedMapping = (labels: string[]) => {
    const suggested = suggestFieldMappingFromLabels(labels);
    setFieldMapping(mergeSuggestedWithPreset(suggested, presetMapping));
    setMappingAutoSuggested(true);
  };

  const runServerTest = async () => {
    if (!formName.trim()) {
      showMessage('יש להזין שם טופס', 'err');
      return;
    }
    if (!(await ensureCloudSession())) return;

    setBusy(true);
    setTestMsg(null);
    setTestMsgKind(null);

    const payload = parsedTest ?? buildFormsAppMockPayload();
    if (!testJson.trim()) {
      setTestJson(JSON.stringify(payload, null, 2));
    }

    const connection = { ...draftConnection, isActive: true, fieldMapping };

    try {
      upsertExternalFormConnection(connection);
      await registerExternalFormConnection(connection);
      setServerSaved(true);

      const res = await sendTestWebhook(connection, payload);
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        activityId?: string;
        parsedFields?: Record<string, string>;
        normalized?: Record<string, string>;
        title?: string;
      };

      if (body.parsedFields && Object.keys(body.parsedFields).length > 0) {
        const labels = Object.keys(body.parsedFields);
        setDetectedFieldLabels(labels);
        setTestJson(JSON.stringify(body.parsedFields, null, 2));
        applySuggestedMapping(labels);
      } else {
        const localLabels = detectExternalFields(payload, provider);
        if (localLabels.length > 0) {
          setDetectedFieldLabels(localLabels);
          applySuggestedMapping(localLabels);
        }
      }

      if (!res.ok || !body.ok) {
        showMessage(
          body.error ??
            (body.parsedFields
              ? 'השרת קיבל את השדות — עדכני מיפוי והריצי שוב'
              : `השרת החזיר שגיאה (${res.status})`),
          body.parsedFields ? 'ok' : 'err',
        );
        return;
      }

      await refreshFromCloudIfNewer();
      showMessage(
        body.activityId
          ? 'בדיקה הצליחה! נוצרה פעילות — המיפוי עודכן לפי השדות שנמצאו'
          : 'השרת אישר — המיפוי עודכן לפי השדות שנמצאו',
        'ok',
      );
    } catch (e) {
      showMessage(registerErrorMessage(e), 'err');
    } finally {
      setBusy(false);
    }
  };

  const updateMapping = (index: number, patch: Partial<ExternalFormFieldMapping>) => {
    setMappingAutoSuggested(false);
    setFieldMapping((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const addMappingRow = () => {
    setMappingAutoSuggested(false);
    setFieldMapping((prev) => [...prev, { externalField: '', appField: 'notes' }]);
  };

  const goToStep4 = async () => {
    if (!formName.trim()) {
      showMessage('יש להזין שם טופס', 'err');
      return;
    }
    const ok = await saveConnectionToServer(false);
    if (ok) {
      showMessage('החיבור נשמר בשרת — העתיקי את קישור ה-Webhook ל-forms.app', 'ok');
      setStep(4);
    }
  };

  const finish = async () => {
    if (!(await ensureCloudSession())) return;
    setBusy(true);
    setTestMsg(null);
    setTestMsgKind(null);
    try {
      upsertExternalFormConnection({ ...draftConnection, fieldMapping, isActive: true });
      await activateExternalFormConnection(connectionId);
      navigate(`/sources/forms/${connectionId}`);
    } catch (e) {
      showMessage(registerErrorMessage(e), 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/sources/forms" className="back-link">
          ← טפסים
        </Link>
        <h1 className="page-title">חיבור טופס חדש</h1>
        <p className="wizard-steps-label">שלב {step} מתוך 6</p>

        {!cloudReady && (
          <p className="provider-card-error">
            חיבור טפסים אמיתי דורש התחברות עם אימייל וסיסמה (לא רק שם משתמש מקומי).
          </p>
        )}

        {step === 1 && (
          <section className="wizard-panel">
            <h2 className="section-title-sm">בחרו ספק טפסים</h2>
            <ul className="provider-pick-list">
              {PROVIDERS.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    className={`provider-pick-btn ${provider === id ? 'provider-pick-btn--on' : ''}`}
                    onClick={() => setProvider(id)}
                    disabled={id !== 'forms_app'}
                  >
                    {EXTERNAL_FORM_PROVIDER_LABELS[id]}
                    {id !== 'forms_app' && ' (בקרוב)'}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
              המשך
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="wizard-panel">
            <h2 className="section-title-sm">פרטי הטופס</h2>
            <div className="field">
              <label htmlFor="form-name">שם הטופס</label>
              <input
                id="form-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="למשל: טופס הזמנת יום הולדת"
              />
            </div>
            <div className="field">
              <label htmlFor="form-url">קישור לטופס (אופציונלי)</label>
              <input
                id="form-url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="field">
              <label htmlFor="activity-type">סוג פעילות שתיווצר</label>
              <select
                id="activity-type"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ExternalFormActivityType)}
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EXTERNAL_FORM_ACTIVITY_LABELS[t]}
                  </option>
                ))}
              </select>
              {activityType !== 'event' && (
                <p className="field-hint">ב-MVP נוצר אירוע — סוגים נוספים בקרוב</p>
              )}
            </div>
            <div className="wizard-nav-row">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                חזרה
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!formName.trim()}
                onClick={() => setStep(3)}
              >
                המשך
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="wizard-panel">
            <h2 className="section-title-sm">קישור חיבור לטופס</h2>
            <ol className="connect-steps">
              <li>לחצי «שמירה והמשך» — חייב להופיע «החיבור נשמר בשרת»</li>
              <li>העתיקי את קישור ה-Webhook המלא (כולל connectionId ו-secret)</li>
              <li>ב-forms.app: Connect → Webhook → Add a webhook → הדביקי את הקישור</li>
              <li>
                <strong>חשוב:</strong> שלחי מילוי דרך Share → Open form — לא דרך הוספת «אירוע»
                באפליקציה
              </li>
            </ol>
            <p className="field-hint">
              הקישור חייב להתחיל ב-<strong>smb-app-gray.vercel.app</strong> — לא כתובת preview
            </p>
            <div className="webhook-copy-box">
              <code>{webhookUrl}</code>
            </div>
            <div className="wizard-btn-row">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => void copyText(webhookUrl)}
              >
                העתקת קישור
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => void copyText(secretKey)}
              >
                העתקת מפתח סודי
              </button>
            </div>
            {serverSaved && (
              <span className="provider-status provider-status--on">מחובר לשרת</span>
            )}
            {testMsg && step === 3 && (
              <p className={testMsgKind === 'err' ? 'provider-card-error' : 'field-hint'}>
                {testMsg}
              </p>
            )}
            <div className="wizard-nav-row">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
                חזרה
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || !formName.trim()}
                onClick={() => void goToStep4()}
              >
                שמירה והמשך
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="wizard-panel">
            <h2 className="section-title-sm">בדיקת מילוי</h2>
            <p className="field-hint">
              שלחי מילוי אמיתי מ-forms.app, או לחצי «בדיקת חיבור לשרת» — נזהה את שמות השדות
              ונציע מיפוי אוטומטי.
            </p>
            <textarea
              className="test-json-area"
              value={testJson}
              onChange={(e) => setTestJson(e.target.value)}
              placeholder="אחרי בדיקה יופיעו כאן השדות שהשרת קיבל מהטופס…"
              rows={8}
            />
            {detectedFields.length > 0 && (
              <div className="card activity-preview-card">
                <strong>שדות שזוהו ({detectedFields.length})</strong>
                <ul className="connect-steps">
                  {detectedFields.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            {mappingAutoSuggested && (
              <p className="field-hint">המיפוי עודכן אוטומטית — ניתן לערוך בשלב הבא</p>
            )}
            {testMsg && (
              <p className={testMsgKind === 'err' ? 'provider-card-error' : 'field-hint'}>
                {testMsg}
              </p>
            )}
            <div className="wizard-btn-row">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || !formName.trim()}
                onClick={() => void runServerTest()}
              >
                בדיקת חיבור לשרת
              </button>
              {detectedFields.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={busy}
                  onClick={() => applySuggestedMapping(detectedFields)}
                >
                  הצעת מיפוי מחדש
                </button>
              )}
            </div>
            <div className="wizard-nav-row">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(3)}>
                חזרה
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={detectedFields.length === 0}
                onClick={() => setStep(5)}
              >
                המשך למיפוי
              </button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="wizard-panel">
            <h2 className="section-title-sm">מיפוי שדות</h2>
            <p className="field-hint">שם שדה בטופס → שדה באפליקציה</p>
            {mappingAutoSuggested && (
              <p className="field-hint">מיפוי מוצע אוטומטית — ודאי שהשדות נכונים לפני הפעלה</p>
            )}
            <ul className="field-mapping-list">
              {fieldMapping.map((row, index) => (
                <li key={`${row.externalField}-${index}`} className="field-mapping-row">
                  <input
                    value={row.externalField}
                    onChange={(e) => updateMapping(index, { externalField: e.target.value })}
                    placeholder="שם שדה בטופס"
                  />
                  <select
                    value={row.appField}
                    onChange={(e) =>
                      updateMapping(index, {
                        appField: e.target.value as ExternalFormFieldMapping['appField'],
                      })
                    }
                  >
                    {APP_FIELD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addMappingRow}>
              + שדה
            </button>
            {activityPreview && (
              <div className="card activity-preview-card">
                <strong>תצוגה מקדימה</strong>
                <p>
                  {activityPreview.clientName} · {activityPreview.title}
                </p>
                <p>
                  {activityPreview.date} · {activityPreview.location}
                </p>
              </div>
            )}
            <div className="wizard-nav-row">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(4)}>
                חזרה
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setStep(6)}>
                המשך
              </button>
            </div>
          </section>
        )}

        {step === 6 && (
          <section className="wizard-panel">
            <h2 className="section-title-sm">הפעלת החיבור</h2>
            <p className="field-hint">
              לאחר הפעלה, כל מילוי טופס חדש ייצור פעילות אוטומטית באפליקציה.
            </p>
            <ul className="connect-steps">
              <li>ספק: {EXTERNAL_FORM_PROVIDER_LABELS[provider]}</li>
              <li>טופס: {formName}</li>
              <li>סוג: {EXTERNAL_FORM_ACTIVITY_LABELS[activityType]}</li>
              <li>{fieldMapping.length} שדות ממופים</li>
              {detectedFields.length > 0 && <li>{detectedFields.length} שדות זוהו מהטופס</li>}
            </ul>
            {testMsg && (
              <p className={testMsgKind === 'err' ? 'provider-card-error' : 'field-hint'}>
                {testMsg}
              </p>
            )}
            <div className="wizard-nav-row">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(5)}>
                חזרה
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => void finish()}
              >
                הפעלת חיבור
              </button>
            </div>
          </section>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
