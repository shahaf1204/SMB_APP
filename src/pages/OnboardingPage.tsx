import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BUSINESS_TYPE_PRESETS } from '../data/businessTypePresets';
import {
  PRIMARY_WORK_MODEL_OPTIONS,
  suggestWorkModelFromPreset,
} from '../lib/workModel';
import { useAppStore } from '../store/useAppStore';
import type { PrimaryWorkModel } from '../types/models';

export function OnboardingPage() {
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business);
  const createBusiness = useAppStore((s) => s.createBusiness);

  useEffect(() => {
    if (business) navigate('/dashboard', { replace: true });
  }, [business, navigate]);

  const [name, setName] = useState('');
  const [mode, setMode] = useState<'list' | 'custom'>('list');
  const [presetId, setPresetId] = useState(BUSINESS_TYPE_PRESETS[0].id);
  const [customType, setCustomType] = useState('');
  const [workModel, setWorkModel] = useState<PrimaryWorkModel>(
    suggestWorkModelFromPreset(BUSINESS_TYPE_PRESETS[0].id),
  );
  const [workModelTouched, setWorkModelTouched] = useState(false);

  useEffect(() => {
    if (mode === 'list' && !workModelTouched) {
      setWorkModel(suggestWorkModelFromPreset(presetId));
    }
  }, [presetId, mode, workModelTouched]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (mode === 'list') {
      const preset = BUSINESS_TYPE_PRESETS.find((p) => p.id === presetId)!;
      createBusiness({
        name: name.trim(),
        businessType: preset.label,
        isGeneric: false,
        businessTypeFromList: true,
        presetId: preset.id,
        primaryWorkModel: workModel,
      });
    } else {
      if (!customType.trim()) return;
      createBusiness({
        name: name.trim(),
        businessType: customType.trim(),
        isGeneric: true,
        businessTypeFromList: false,
        primaryWorkModel: workModel,
      });
    }
    navigate('/dashboard');
  };

  return (
    <div className="page">
      <h1 className="page-title">פתיחת עסק</h1>
      <p className="page-subtitle">צרי עסק חדש — נתאים את הדשבורד לסוג העבודה שלך</p>

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label htmlFor="biz-name">שם העסק</label>
          <input
            id="biz-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: סטודיו פילאטיס"
            required
          />
        </div>

        <div className="field">
          <label>סוג עסק</label>
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
            <label htmlFor="preset">בחרי סוג עסק</label>
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
            <label htmlFor="custom">סוג עסק מותאם</label>
            <input
              id="custom"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="לדוגמה: מעצבת אירועים"
              required={mode === 'custom'}
            />
          </div>
        )}

        <fieldset className="engagement-fieldset work-model-fieldset">
          <legend>איך את/ה עובד/ת בעיקר?</legend>
          <p className="field-hint" style={{ marginTop: 0 }}>
            זה משפיע על הדשבורד ועל «➕ חדש» — אפשר לשנות בהגדרות
          </p>
          <div className="work-model-grid">
            {PRIMARY_WORK_MODEL_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={`work-model-option ${workModel === opt.id ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="work-model"
                  value={opt.id}
                  checked={workModel === opt.id}
                  onChange={() => {
                    setWorkModelTouched(true);
                    setWorkModel(opt.id);
                  }}
                />
                <span className="work-model-option-icon" aria-hidden>
                  {opt.icon}
                </span>
                <span className="work-model-option-text">
                  <strong>{opt.title}</strong>
                  <span>{opt.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn btn-primary">
          צרי עסק והתחילי
        </button>
      </form>
    </div>
  );
}
