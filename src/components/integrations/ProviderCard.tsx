import { useState, type CSSProperties, type FormEvent } from 'react';
import type { IntegrationConnection, ProviderCatalogEntry } from '../../types/integrations';
import { formatLastSync } from '../../lib/integrations/client';
import { Modal } from '../ui/Modal';

interface ProviderCardProps {
  entry: ProviderCatalogEntry;
  connection?: IntegrationConnection;
  onConnect: (apiKey: string, accountLabel?: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSync: () => Promise<void>;
  busy?: boolean;
}

export function ProviderCard({
  entry,
  connection,
  onConnect,
  onDisconnect,
  onSync,
  busy,
}: ProviderCardProps) {
  const [showConnect, setShowConnect] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyId, setApiKeyId] = useState('');
  const [apiKeySecret, setApiKeySecret] = useState('');
  const [accountLabel, setAccountLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const connected = connection?.connectionStatus === 'connected';
  const hasError = connection?.connectionStatus === 'error';
  const isOAuth = entry.authMethod === 'oauth';
  const isDualKey = entry.credentialFields === 'dual';

  const handleConnect = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const credential = isDualKey
      ? `${apiKeyId.trim()}:${apiKeySecret.trim()}`
      : apiKey.trim();
    if (!isOAuth && !isDualKey && !credential) {
      setError('נדרש מפתח API');
      return;
    }
    if (isDualKey && (!apiKeyId.trim() || !apiKeySecret.trim())) {
      setError('נדרשים גם API Key ID וגם Secret');
      return;
    }
    try {
      await onConnect(credential, accountLabel.trim() || entry.nameHe);
      setShowConnect(false);
      setApiKey('');
      setApiKeyId('');
      setApiKeySecret('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאת חיבור');
    }
  };

  return (
    <>
      <article
        className={`provider-card ${connected ? 'provider-card--connected' : ''} ${hasError ? 'provider-card--error' : ''}`}
        style={{ '--provider-color': entry.brandColor } as CSSProperties}
      >
        <div className="provider-card-head">
          <span className="provider-card-logo" aria-hidden>
            {entry.logoEmoji}
          </span>
          <div className="provider-card-info">
            <strong>{entry.nameHe}</strong>
            <p>{entry.description}</p>
          </div>
          <span
            className={`provider-status ${connected ? 'provider-status--on' : hasError ? 'provider-status--err' : ''}`}
          >
            {connected ? 'מחובר' : hasError ? 'שגיאה' : 'לא מחובר'}
          </span>
        </div>

        {connection && (
          <div className="provider-card-meta">
            <span>סנכרון אחרון: {formatLastSync(connection.lastSync)}</span>
            {connection.accountLabel && <span> · {connection.accountLabel}</span>}
            {connection.lastError && (
              <p className="provider-card-error">{connection.lastError}</p>
            )}
          </div>
        )}

        <div className="provider-card-actions">
          {connected ? (
            <>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void onSync()}>
                סנכרון
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void onDisconnect()}>
                ניתוק
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={busy || !entry.available}
              onClick={() => setShowConnect(true)}
            >
              חיבור
            </button>
          )}
        </div>
      </article>

      <Modal open={showConnect} onClose={() => setShowConnect(false)} title={`חיבור ${entry.nameHe}`}>
        <form onSubmit={(e) => void handleConnect(e)} className="connect-provider-form">
          {entry.connectSteps && entry.connectSteps.length > 0 && (
            <ol className="connect-steps">
              {entry.connectSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
          {isOAuth ? (
            <p className="field-hint">
              {entry.connectSteps
                ? 'אם יש לכם Access Token — ניתן להדביק למטה. אחרת «חבר ספק» מספיק לחיבור ראשוני.'
                : 'ניתן להתחבר עכשיו. אם יש לכם Access Token — הזינו אותו. אחרת לחצו «חבר ספק».'}
            </p>
          ) : (
            <p className="field-hint">
              {isDualKey
                ? 'המפתחות נשמרים מוצפנים בשרת. אין גישה? השתמשו ב«ספק דמו» לבדיקות.'
                : 'המפתח נשמר מוצפן בשרת ולא בדפדפן.'}
            </p>
          )}
          {isDualKey ? (
            <>
              <div className="field">
                <label htmlFor={`key-id-${entry.id}`}>API Key ID</label>
                <input
                  id={`key-id-${entry.id}`}
                  type="text"
                  value={apiKeyId}
                  onChange={(e) => setApiKeyId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor={`key-secret-${entry.id}`}>API Key Secret</label>
                <input
                  id={`key-secret-${entry.id}`}
                  type="password"
                  value={apiKeySecret}
                  onChange={(e) => setApiKeySecret(e.target.value)}
                  placeholder="מוצג פעם אחת ב-Morning"
                  autoComplete="off"
                  required
                />
              </div>
            </>
          ) : (
          <div className="field">
            <label htmlFor={`key-${entry.id}`}>
              {isOAuth ? 'Access Token (אופציונלי)' : 'מפתח API'}
            </label>
            <input
              id={`key-${entry.id}`}
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={entry.id === 'mock' ? 'mock-demo' : isOAuth ? 'אופציונלי' : '••••••••'}
              autoComplete="off"
              required={!isOAuth}
            />
          </div>
          )}
          <div className="field">
            <label htmlFor={`label-${entry.id}`}>שם חשבון (אופציונלי)</label>
            <input
              id={`label-${entry.id}`}
              value={accountLabel}
              onChange={(e) => setAccountLabel(e.target.value)}
              placeholder={entry.nameHe}
            />
          </div>
          {error && <p className="import-feedback">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            חבר ספק
          </button>
        </form>
      </Modal>
    </>
  );
}
