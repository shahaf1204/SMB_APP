import { FormEvent } from 'react';
import { ONBOARDING_BUSINESS_TYPE_PRESETS } from '../../data/businessTypePresets';

export function OnboardingStepIdentity({
  name,
  mode,
  presetId,
  customType,
  onNameChange,
  onModeChange,
  onPresetChange,
  onCustomTypeChange,
  onSubmit,
}: {
  name: string;
  mode: 'list' | 'custom';
  presetId: string;
  customType: string;
  onNameChange: (v: string) => void;
  onModeChange: (v: 'list' | 'custom') => void;
  onPresetChange: (v: string) => void;
  onCustomTypeChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (mode === 'custom' && !customType.trim()) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="onboarding-panel card">
      <div className="field">
        <label htmlFor="biz-name">שם העסק</label>
        <input
          id="biz-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="לדוגמה: סטודיו רותם"
          required
          autoComplete="organization"
        />
      </div>

      <div className="field">
        <label htmlFor="biz-type">סוג העסק</label>
        {mode === 'list' ? (
          <select
            id="biz-type"
            value={presetId}
            onChange={(e) => onPresetChange(e.target.value)}
          >
            {ONBOARDING_BUSINESS_TYPE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
            <option value="__other__">אחר</option>
          </select>
        ) : (
          <input
            id="biz-type-custom"
            value={customType}
            onChange={(e) => onCustomTypeChange(e.target.value)}
            placeholder="תאר/י את סוג העסק"
            required
          />
        )}
        {mode === 'list' && presetId === '__other__' && (
          <input
            className="onboarding-other-input"
            value={customType}
            onChange={(e) => onCustomTypeChange(e.target.value)}
            placeholder="תאר/י את סוג העסק"
            required
            aria-label="סוג עסק מותאם"
          />
        )}
        {mode === 'list' && presetId !== '__other__' && (
          <button
            type="button"
            className="btn btn-ghost onboarding-type-toggle"
            onClick={() => {
              onModeChange('custom');
              onCustomTypeChange('');
            }}
          >
            לא מוצא/ת? הזינ/י סוג מותאם
          </button>
        )}
        {mode === 'custom' && (
          <button
            type="button"
            className="btn btn-ghost onboarding-type-toggle"
            onClick={() => onModeChange('list')}
          >
            חזרה לרשימה
          </button>
        )}
      </div>

      <button type="submit" className="btn btn-primary onboarding-cta">
        המשך להתאמת צורת העבודה
      </button>
    </form>
  );
}
