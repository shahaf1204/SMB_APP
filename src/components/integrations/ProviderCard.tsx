import { useState } from 'react';
import type { IntegrationConnection, ProviderCatalogEntry } from '../../types/integrations';
import { normalizeIntegrationConnection } from '../../types/integrations';
import { formatLastSync, testConnectionProvider } from '../../lib/integrations/client';
import { Modal } from '../ui/Modal';

interface ProviderCardProps {
  entry: ProviderCatalogEntry;
  connection?: IntegrationConnection;
  onConnect: (apiKey: string, accountLabel?: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSync: () => Promise<void>;
  onTest?: () => Promise<void>;
  busy?: boolean;
}

function statusLabel(status?: IntegrationConnection['status']): string {
  switch (status) {
    case 'connected':
      return 'מחובר';
    case 'mock':
    case 'sandbox':
      return 'בדיקות';
    case 'error':
      return 'שגיאה';
    case 'syncing':
      return 'מסנכרן…';
    default:
      return 'לא מחובר';
  }
}

function modeLabel(mode?: IntegrationConnection['mode']): string {
  switch (mode) {
    case 'mock':
      return 'Mock';
    case 'sandbox':
      return 'Sandbox';
    case 'production':
      return 'Production';
    default:
      return '—';
  }
}

export function ProviderCard({
  entry,
  connection,
  onConnect,
  onDisconnect,
  onSync,
  onTest,
  busy,
}: ProviderCardProps) {
  const [showConnect, setShowConnect] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyId, setApiKeyId] = useState('');
  const [apiKeySecret, setApiKeySecret] = useState('');
  const [accountLabel, setAccountLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  const conn = connection
    ? normalizeIntegrationConnection(connection as IntegrationConnection & { provider?: string })
    : undefined;
  const connected = conn?.status === 'connected' || conn?.status === 'mock' || conn?.status === 'sandbox';
  const hasError = conn?.status === 'error';
  const isOAuth = entry.authMethod === 'oauth';
  const isDualKey = entry.credentialFields === 'dual';
  const mockOnly = entry.mockConnect === true;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mockOnly) {
      try {
        await onConnect('', entry.nameHe);
        setShowConnect(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאת חיבור');
      }
      return;
    }
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

  const handleTest = async () => {
    if (onTest) {
      await onTest();
      return;
    }
    if (!conn) return;
    setTestMsg(null);
    const result = await testConnectionProvider({
      connectionId: conn.id,
      businessId: conn.businessId,
      provider: conn.providerId,
    });
    setTestMsg(result.message ?? (result.ok ? 'החיבור תקין' : 'שגיאה'));
  };

  return (
    <>
      <article
        className={`provider-card ${connected ? 'provider-card--connected' : ''} ${hasError ? 'provider-card--error' : ''}`}
        style={{ '--provider-color': entry.brandColor } as React.CSSProperties}
      >
        <div className="provider-card-head">
          <span className="provider-card-logo" aria-hidden>
            {entry.logoEmoji}
          </span>
          <div className="provider-card-info">
            <strong>{entry.nameHe}</strong>
            <p>{entry.description}</p>
            <span className="provider-category-chip">{entry.category}</span>
          </div>
          <div className="provider-chip-col">
            <span
              className={`provider-status ${connected ? 'provider-status--on' : hasError ? 'provider-status--err' : ''}`}
            >
              {statusLabel(conn?.status)}
            </span>
            {conn && (
              <span className="provider-mode-chip">{modeLabel(conn.mode)}</span>
            )}
          </div>
        </div>

        {entry.comingSoon && !connected && (
          <p className="provider-coming-soon">בקרוב — עדיין לא ניתן להתחבר</p>
        )}

        {conn && (
          <div className="provider-card-meta">
            <span>סנכרון אחרון: {formatLastSync(conn.lastSyncAt ?? conn.lastSync)}</span>
            {conn.accountLabel && <span> · {conn.accountLabel}</span>}
            {conn.lastError && <p className="provider-card-error">{conn.lastError}</p>}
            {testMsg && <p className="field-hint">{testMsg}</p>}
          </div>
        )}

        <div className="provider-card-actions">
          {connected ? (
            <>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void onSync()}>
                סנכרון
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void handleTest()}>
                בדיקת חיבור
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
              {mockOnly ? 'חיבור ספק בדיקות' : 'חיבור ספק'}
            </button>
          )}
        </div>
      </article>

      <Modal
        open={showConnect}
        onClose={() => setShowConnect(false)}
        title={mockOnly ? 'חיבור ספק בדיקות' : `חיבור ${entry.nameHe}`}
      >
        <form onSubmit={(e) => void handleConnect(e)} className="connect-provider-form">
          {entry.connectSteps && entry.connectSteps.length > 0 && (
            <ol className="connect-steps">
              {entry.connectSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
          {mockOnly ? (
            <p className="field-hint">
              אין צורך במפתח API. החיבור יאפשר להפיק חשבוניות דמו, קישורי תשלום וסימולציית webhook.
            </p>
          ) : isOAuth ? (
            <p className="field-hint">חיבור OAuth יושק בגרסה הבאה.</p>
          ) : (
            <p className="field-hint">מפתחות API נשמרים מוצפנים בשרת — לא בדפדפן.</p>
          )}
          {!mockOnly && isDualKey && (
            <>
              <div className="field">
                <label htmlFor={`key-id-${entry.id}`}>API Key ID</label>
                <input
                  id={`key-id-${entry.id}`}
                  type="text"
                  value={apiKeyId}
                  onChange={(e) => setApiKeyId(e.target.value)}
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
                  autoComplete="off"
                  required
                />
              </div>
            </>
          )}
          {!mockOnly && !isDualKey && !isOAuth && (
            <div className="field">
              <label htmlFor={`key-${entry.id}`}>מפתח API</label>
              <input
                id={`key-${entry.id}`}
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
          )}
          {!mockOnly && (
            <div className="field">
              <label htmlFor={`label-${entry.id}`}>שם חשבון (אופציונלי)</label>
              <input
                id={`label-${entry.id}`}
                value={accountLabel}
                onChange={(e) => setAccountLabel(e.target.value)}
                placeholder={entry.nameHe}
              />
            </div>
          )}
          {error && <p className="import-feedback">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {mockOnly ? 'חיבור ספק בדיקות' : 'חבר ספק'}
          </button>
        </form>
      </Modal>
    </>
  );
}
