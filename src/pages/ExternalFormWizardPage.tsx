import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { createId } from '../lib/ids';
import {
  APP_FIELD_OPTIONS,
  BIRTHDAY_PARTY_DEFAULT_MAPPING,
} from '../lib/externalForms/fieldMapping';
import {
  buildWebhookUrl,
  detectExternalFields,
  generateSecretKey,
  normalizeSubmission,
} from '../lib/externalForms/connectionWebhook';
import { previewActivityFromSubmission } from '../lib/externalForms/processSubmission';
import { sendTestWebhook } from '../lib/externalForms/clientApi';
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

const SAMPLE_BIRTHDAY_JSON = `{
  "שם ההורה": "דנה כהן",
  "טלפון": "0501234567",
  "אימייל": "dana@example.com",
  "שם הילד/ה": "יואב",
  "גיל הילד/ה": "7",
  "תאריך האירוע": "2026-08-15",
  "שעת האירוע": "16:00",
  "מיקום האירוע": "גן אירועים",
  "מספר משתתפים": "25",
  "חבילת פעילות": "VIP",
  "הערות": "אלרגיה לבוטנים"
}`;

export function ExternalFormWizardPage() {
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business)!;
  const user = useAppStore((s) => s.user)!;
  const upsertExternalFormConnection = useAppStore((s) => s.upsertExternalFormConnection);
  const activateExternalFormConnection = useAppStore((s) => s.activateExternalFormConnection);
  const processExternalFormSubmission = useAppStore((s) => s.processExternalFormSubmission);

  const [step, setStep] = useState(1);
  const [connectionId] = useState(() => createId());
  const [secretKey] = useState(() => generateSecretKey());
  const [provider, setProvider] = useState<ExternalFormProviderId>('forms_app');
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [activityType, setActivityType] = useState<ExternalFormActivityType>('event');
  const [fieldMapping, setFieldMapping] = useState<ExternalFormFieldMapping[]>(
    BIRTHDAY_PARTY_DEFAULT_MAPPING,
  );
  const [testJson, setTestJson] = useState(SAMPLE_BIRTHDAY_JSON);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    if (!parsedTest) return [];
    return detectExternalFields(parsedTest, provider);
  }, [parsedTest, provider]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setTestMsg('הועתק!');
      setTimeout(() => setTestMsg(null), 2000);
    } catch {
      setTestMsg('לא ניתן להעתיק');
    }
  };

  const updateMapping = (index: number, patch: Partial<ExternalFormFieldMapping>) => {
    setFieldMapping((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const addMappingRow = () => {
    setFieldMapping((prev) => [...prev, { externalField: '', appField: 'notes' }]);
  };

  const runTest = async () => {
    setBusy(true);
    setTestMsg(null);
    try {
      if (!parsedTest) throw new Error('JSON לא תקין');
      upsertExternalFormConnection({ ...draftConnection, isActive: true });
      await activateExternalFormConnection(connectionId);

      const res = await sendTestWebhook({ ...draftConnection, isActive: true }, parsedTest);
      if (!res.ok) {
        const eventId = processExternalFormSubmission({
          connectionId,
          rawPayload: parsedTest,
        });
        if (eventId) {
          setTestMsg('נוצרה פעילות בדיקה (מקומי)');
          return;
        }
        throw new Error('שגיאת webhook');
      }

      const eventId = processExternalFormSubmission({
        connectionId,
        rawPayload: parsedTest,
      });
      setTestMsg(eventId ? 'נוצרה פעילות בדיקה בהצלחה!' : 'הטופס התקבל — בדקו מיפוי שדות');
    } catch (e) {
      const eventId = parsedTest
        ? processExternalFormSubmission({ connectionId, rawPayload: parsedTest })
        : null;
      setTestMsg(
        eventId
          ? 'נוצרה פעילות בדיקה (מקומי)'
          : e instanceof Error
            ? e.message
            : 'שגיאה',
      );
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    upsertExternalFormConnection(draftConnection);
    await activateExternalFormConnection(connectionId);
    setBusy(false);
    navigate(`/settings/external-forms/${connectionId}`);
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/settings/external-forms" className="back-link">
          ← טפסים חיצוניים
        </Link>
        <h1 className="page-title">חיבור טופס חדש</h1>
        <p className="wizard-steps-label">שלב {step} מתוך 6</p>

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
                  >
                    {EXTERNAL_FORM_PROVIDER_LABELS[id]}
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
            <p className="field-hint">
              הדביקי את הקישור הזה בהגדרות ה-Webhook של ספק הטפסים שלך
            </p>
            <div className="webhook-copy-box">
              <code>{webhookUrl}</code>
            </div>
            <div className="wizard-btn-row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void copyText(webhookUrl)}>
                העתקת קישור
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void copyText(secretKey)}>
                העתקת מפתח סודי
              </button>
            </div>
            <div className="wizard-nav-row">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
                חזרה
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setStep(4)}>
                המשך
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="wizard-panel">
            <h2 className="section-title-sm">מיפוי שדות</h2>
            <p className="field-hint">שם שדה בטופס → שדה באפליקציה</p>
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
                      updateMapping(index, { appField: e.target.value as ExternalFormFieldMapping['appField'] })
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
            <div className="wizard-nav-row">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(3)}>
                חזרה
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setStep(5)}>
                המשך
              </button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="wizard-panel">
            <h2 className="section-title-sm">בדיקת מילוי</h2>
            <p className="field-hint">הדביקי דוגמת JSON או שלחי בדיקה</p>
            <textarea
              className="test-json-area"
              value={testJson}
              onChange={(e) => setTestJson(e.target.value)}
              rows={8}
            />
            {detectedFields.length > 0 && (
              <p className="field-hint">שדות שזוהו: {detectedFields.join(', ')}</p>
            )}
            {activityPreview && (
              <div className="card activity-preview-card">
                <strong>תצוגה מקדימה</strong>
                <p>{activityPreview.clientName} · {activityPreview.title}</p>
                <p>{activityPreview.date} · {activityPreview.location}</p>
              </div>
            )}
            {testMsg && <p className="field-hint">{testMsg}</p>}
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void runTest()}>
              שליחת בדיקה
            </button>
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
            </ul>
            <div className="wizard-nav-row">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(5)}>
                חזרה
              </button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void finish()}>
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
