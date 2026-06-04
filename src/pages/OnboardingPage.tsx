import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BUSINESS_TYPE_PRESETS } from '../data/businessTypePresets';
import { useAppStore } from '../store/useAppStore';

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
      });
    } else {
      if (!customType.trim()) return;
      createBusiness({
        name: name.trim(),
        businessType: customType.trim(),
        isGeneric: true,
        businessTypeFromList: false,
      });
    }
    navigate('/dashboard');
  };

  return (
    <div className="page">
      <h1 className="page-title">פתיחת עסק</h1>
      <p className="page-subtitle">צרי עסק חדש ובחרי סוג — נטענו קטגוריות ברירת מחדל</p>

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label htmlFor="biz-name">שם העסק</label>
          <input
            id="biz-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: אירועי שמחה"
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

        <button type="submit" className="btn btn-primary">
          צרי עסק והתחילי
        </button>
      </form>
    </div>
  );
}
