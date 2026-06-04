import { FormEvent, useState } from 'react';
import {
  AI_PROVIDER_LABELS,
  defaultBaseUrl,
  defaultModel,
  isPaidAiReady,
  loadAiSettings,
  saveAiSettings,
} from '../lib/aiSettings';
import type { AiProviderId, AiSettings } from '../types/ai';

interface AiSettingsFormProps {
  onSaved?: () => void;
  compact?: boolean;
}

export function AiSettingsForm({ onSaved, compact }: AiSettingsFormProps) {
  const [settings, setSettings] = useState<AiSettings>(() => loadAiSettings());
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<AiSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
    setSaved(false);
  };

  const onProviderChange = (provider: AiProviderId) => {
    setSettings((s) => ({
      ...s,
      provider,
      enabled: provider !== 'none',
      baseUrl: defaultBaseUrl(provider),
      model: defaultModel(provider),
    }));
    setSaved(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveAiSettings(settings);
    setSaved(true);
    onSaved?.();
  };

  const ready = isPaidAiReady(settings);

  return (
    <form onSubmit={handleSubmit} className="ai-settings-form">
      {!compact && (
        <p className="field-hint" style={{ marginTop: 0 }}>
          חיבור אופציונלי לספק AI בתשלום שלכם. המפתח נשמר רק במכשיר זה; העלות
          חיובית אצל הספק (OpenAI, Google וכו&apos;), לא אצל מפתח האפליקציה.
        </p>
      )}

      <div className="field">
        <label htmlFor="ai-provider">ספק AI</label>
        <select
          id="ai-provider"
          value={settings.provider}
          onChange={(e) => onProviderChange(e.target.value as AiProviderId)}
        >
          {(Object.keys(AI_PROVIDER_LABELS) as AiProviderId[]).map((id) => (
            <option key={id} value={id}>
              {AI_PROVIDER_LABELS[id]}
            </option>
          ))}
        </select>
      </div>

      {settings.provider !== 'none' && (
        <>
          <div className="field">
            <label htmlFor="ai-key">
              מפתח API {settings.provider === 'ollama' ? '(אופציונלי)' : ''}
            </label>
            <input
              id="ai-key"
              type="password"
              autoComplete="off"
              placeholder={settings.provider === 'ollama' ? 'לרוב לא נדרש' : 'sk-...'}
              value={settings.apiKey}
              onChange={(e) => update({ apiKey: e.target.value })}
            />
          </div>

          {settings.provider !== 'gemini' && (
            <div className="field">
              <label htmlFor="ai-base">כתובת API (Base URL)</label>
              <input
                id="ai-base"
                type="url"
                dir="ltr"
                value={settings.baseUrl}
                onChange={(e) => update({ baseUrl: e.target.value })}
              />
              <p className="field-hint">
                OpenAI מהדפדפן לעיתים נחסם — Ollama / LM Studio מקומיים עובדים
                טוב יותר.
              </p>
            </div>
          )}

          <div className="field">
            <label htmlFor="ai-model">שם מודל</label>
            <input
              id="ai-model"
              dir="ltr"
              value={settings.model}
              onChange={(e) => update({ model: e.target.value })}
            />
          </div>

          <p
            className="field-hint"
            style={{ color: ready ? 'var(--color-success, #0a7)' : undefined }}
          >
            {ready ? 'מחובר — העוזר ישתמש במודל בתשלום בצ\'אט.' : 'מלאו מפתח ומודל לשמירה.'}
          </p>
        </>
      )}

      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
        שמירת הגדרות AI
      </button>
      {saved && (
        <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>נשמר.</p>
      )}
    </form>
  );
}
