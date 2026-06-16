import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BUSINESS_TYPE_PRESETS } from '../data/businessTypePresets';
import {
  suggestWorkModelsFromPreset,
  WORK_CONCEPT_OPTIONS,
  workModelsLabel,
} from '../lib/workModel';
import { useAppStore } from '../store/useAppStore';
import type { WorkConcept } from '../types/models';

export function OnboardingPage() {
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business);
  const createBusiness = useAppStore((s) => s.createBusiness);

  useEffect(() => {
    if (business) navigate('/dashboard', { replace: true });
  }, [business, navigate]);

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'list' | 'custom'>('list');
  const [presetId, setPresetId] = useState(BUSINESS_TYPE_PRESETS[0].id);
  const [customType, setCustomType] = useState('');
  const [workModels, setWorkModels] = useState<WorkConcept[]>(
    suggestWorkModelsFromPreset(BUSINESS_TYPE_PRESETS[0].id),
  );
  const [workModelsTouched, setWorkModelsTouched] = useState(false);

  useEffect(() => {
    if (mode === 'list' && !workModelsTouched) {
      setWorkModels(suggestWorkModelsFromPreset(presetId));
    }
  }, [presetId, mode, workModelsTouched]);

  const toggleConcept = (id: WorkConcept) => {
    setWorkModelsTouched(true);
    setWorkModels((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((m) => m !== id);
        return next.length > 0 ? next : prev;
      }
      return [...prev, id];
    });
  };

  const handleStep1 = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (mode === 'custom' && !customType.trim()) return;
    setStep(2);
  };

  const handleFinish = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || workModels.length === 0) return;

    if (mode === 'list') {
      const preset = BUSINESS_TYPE_PRESETS.find((p) => p.id === presetId)!;
      createBusiness({
        name: name.trim(),
        businessType: preset.label,
        isGeneric: false,
        businessTypeFromList: true,
        presetId: preset.id,
        workModels,
      });
    } else {
      createBusiness({
        name: name.trim(),
        businessType: customType.trim(),
        isGeneric: true,
        businessTypeFromList: false,
        workModels,
      });
    }
    navigate('/dashboard');
  };

  const suggestedLabel =
    mode === 'list'
      ? workModelsLabel(suggestWorkModelsFromPreset(presetId))
      : null;

  return (
    <div className="page onboarding-page">
      <h1 className="page-title">ברוכים הבאים</h1>
      <p className="page-subtitle">
        {step === 1
          ? 'בואו נגדיר את העסק — האפליקציה תתאים את עצמה אליך'
          : 'איך העסק שלך עובד? אפשר לבחור יותר מאפשרות אחת'}
      </p>

      <div className="onboarding-steps" aria-hidden>
        <span className={step >= 1 ? 'active' : ''}>1. העסק</span>
        <span className={step >= 2 ? 'active' : ''}>2. קונסept</span>
      </div>

      {step === 1 ? (
        <form onSubmit={handleStep1} className="card">
          <div className="field">
            <label htmlFor="biz-name">שם העסק</label>
            <input
              id="biz-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: סטודיו פילאטיס / אירועי שמחה"
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
                placeholder="לדוגמה: מדריך כושר / מפעילת ימי הולדת"
                required={mode === 'custom'}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary">
            המשך ←
          </button>
        </form>
      ) : (
        <form onSubmit={handleFinish} className="card">
          {suggestedLabel && !workModelsTouched && (
            <p className="onboarding-suggestion">
              💡 לפי סוג העסק — מומלץ: <strong>{suggestedLabel}</strong>
            </p>
          )}

          <fieldset className="engagement-fieldset work-model-fieldset">
            <legend>באילו קונסeptים את/ה משתמש/ת?</legend>
            <p className="field-hint" style={{ marginTop: 0 }}>
              למשל: מאמן כושר → כרטיסיות · מפעילת ימי הולדת → אירועים בודדים ·
              שילוב → סמן/י כמה אפשרויות
            </p>
            <div className="work-model-grid">
              {WORK_CONCEPT_OPTIONS.map((opt) => {
                const selected = workModels.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`work-model-option work-model-option-multi ${selected ? 'active' : ''}`}
                    onClick={() => toggleConcept(opt.id)}
                    aria-pressed={selected}
                  >
                    <span className="work-model-option-check" aria-hidden>
                      {selected ? '✓' : ''}
                    </span>
                    <span className="work-model-option-icon" aria-hidden>
                      {opt.icon}
                    </span>
                    <span className="work-model-option-text">
                      <strong>{opt.title}</strong>
                      <span>{opt.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <p className="field-hint" style={{ textAlign: 'center' }}>
            נבחר: {workModelsLabel(workModels)}
          </p>

          <div className="onboarding-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
              → חזרה
            </button>
            <button type="submit" className="btn btn-primary">
              התחל/י לעבוד
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
