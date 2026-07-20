import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BUSINESS_TYPE_PRESETS } from '../data/businessTypePresets';
import { OperatingModelCard } from '../components/workspace/OperatingModelCard';
import { buildWorkspaceFromOnboarding } from '../components/workspace/OperatingModelSettings';
import {
  OPERATING_MODEL_ADDITIONAL_OPTIONS,
  OPERATING_MODEL_ONBOARDING_OPTIONS,
} from '../config/operatingModelConfig';
import { syncWorkModelsFromWorkspace } from '../lib/workspace';
import { useAppStore } from '../store/useAppStore';
import type { OperatingModel } from '../types/workspace';

export function OnboardingPage() {
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business);
  const createBusiness = useAppStore((s) => s.createBusiness);

  useEffect(() => {
    if (business?.workspace?.onboardingCompleted) {
      navigate('/dashboard', { replace: true });
    }
  }, [business, navigate]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'list' | 'custom'>('list');
  const [presetId, setPresetId] = useState(BUSINESS_TYPE_PRESETS[0].id);
  const [customType, setCustomType] = useState('');
  const [primaryModel, setPrimaryModel] = useState<OperatingModel>('event');
  const [additionalModels, setAdditionalModels] = useState<OperatingModel[]>([]);

  const handleStep1 = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (mode === 'custom' && !customType.trim()) return;
    setStep(2);
  };

  const handleStep2 = (e: FormEvent) => {
    e.preventDefault();
    if (!primaryModel) return;
    if (primaryModel !== 'hybrid') {
      setAdditionalModels((prev) => prev.filter((m) => m !== primaryModel));
    } else {
      setAdditionalModels([]);
    }
    setStep(3);
  };

  const toggleAdditional = (model: OperatingModel) => {
    if (primaryModel !== 'hybrid' && model === primaryModel) return;
    setAdditionalModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model],
    );
  };

  const handleFinish = (e: FormEvent) => {
    e.preventDefault();
    if (primaryModel === 'hybrid' && additionalModels.length < 2) return;

    const preset = mode === 'list' ? presetId : undefined;
    const workspace = buildWorkspaceFromOnboarding(
      primaryModel,
      primaryModel === 'hybrid' ? additionalModels : [primaryModel, ...additionalModels],
      preset,
    );
    const workModels = syncWorkModelsFromWorkspace(workspace);

    if (mode === 'list') {
      const presetDef = BUSINESS_TYPE_PRESETS.find((p) => p.id === presetId)!;
      createBusiness({
        name: name.trim(),
        businessType: presetDef.label,
        isGeneric: false,
        businessTypeFromList: true,
        presetId: presetDef.id,
        workModels,
        workspace,
      });
    } else {
      createBusiness({
        name: name.trim(),
        businessType: customType.trim(),
        isGeneric: true,
        businessTypeFromList: false,
        workModels,
        workspace,
      });
    }
    navigate('/dashboard');
  };

  const additionalOptions =
    primaryModel === 'hybrid'
      ? OPERATING_MODEL_ONBOARDING_OPTIONS.filter((o) => o.id !== 'hybrid')
      : OPERATING_MODEL_ADDITIONAL_OPTIONS.filter((o) => o.id !== primaryModel);

  return (
    <div className="page onboarding-page">
      <h1 className="page-title">ברוכים הבאים</h1>
      <p className="page-subtitle">
        {step === 1 && 'בואו נגדיר את העסק — האפליקציה תתאים את עצמה אליך'}
        {step === 2 && 'איך העסק שלך עובד ביום-יום?'}
        {step === 3 && 'רוצה לשלב גם מודלים נוספים?'}
      </p>

      <div className="onboarding-steps" aria-hidden>
        <span className={step >= 1 ? 'active' : ''}>1. העסק</span>
        <span className={step >= 2 ? 'active' : ''}>2. צורת עבודה</span>
        <span className={step >= 3 ? 'active' : ''}>3. אישור</span>
      </div>

      {step === 1 ? (
        <form onSubmit={handleStep1} className="card">
          <div className="field">
            <label htmlFor="biz-name">שם העסק</label>
            <input
              id="biz-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: סטודיו פילאטיס / ייעוץ עסקי"
              required
            />
          </div>

          <div className="field">
            <label>סוג העסק</label>
            <div className="chip-row">
              <button
                type="button"
                className={`chip ${mode === 'list' ? 'active' : ''}`}
                onClick={() => setMode('list')}
              >
                מרשימה
              </button>
              <button
                type="button"
                className={`chip ${mode === 'custom' ? 'active' : ''}`}
                onClick={() => setMode('custom')}
              >
                מותאם אישית
              </button>
            </div>
          </div>

          {mode === 'list' ? (
            <div className="field">
              <label htmlFor="preset">מה סוג העסק?</label>
              <select id="preset" value={presetId} onChange={(e) => setPresetId(e.target.value)}>
                {BUSINESS_TYPE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="field">
              <label htmlFor="custom">תיאור סוג העסק</label>
              <input
                id="custom"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="לדוגמה: מדריך כושר / יועץ עסקי"
                required={mode === 'custom'}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary">
            המשך ←
          </button>
        </form>
      ) : step === 2 ? (
        <form onSubmit={handleStep2} className="card">
          <p className="field-hint" style={{ marginTop: 0 }}>
            בחר/י את צורת העבודה העיקרית. אפשר להוסיף מודלים נוספים בשלב הבא.
          </p>
          <div className="work-model-grid">
            {OPERATING_MODEL_ONBOARDING_OPTIONS.map((opt) => (
              <OperatingModelCard
                key={opt.id}
                icon={opt.icon}
                title={opt.titleHe}
                description={opt.descriptionHe}
                selected={primaryModel === opt.id}
                onSelect={() => setPrimaryModel(opt.id)}
              />
            ))}
          </div>
          <div className="onboarding-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
              → חזרה
            </button>
            <button type="submit" className="btn btn-primary">
              המשך ←
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleFinish} className="card">
          <p className="field-hint" style={{ marginTop: 0 }}>
            {primaryModel === 'hybrid'
              ? 'בחר/י לפחות שני מודלים שמתאימים לעסק שלך.'
              : 'אפשר לסמן מודלים נוספים — לא חובה.'}
          </p>
          <div className="work-model-grid">
            {additionalOptions.map((opt) => (
              <OperatingModelCard
                key={opt.id}
                icon={opt.icon}
                title={opt.titleHe}
                description={opt.descriptionHe}
                selected={additionalModels.includes(opt.id)}
                onSelect={() => toggleAdditional(opt.id)}
              />
            ))}
          </div>
          <div className="onboarding-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
              → חזרה
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={primaryModel === 'hybrid' && additionalModels.length < 2}
            >
              התחל/י לעבוד
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
