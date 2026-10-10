import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { IntegrationConnection } from '../../types/integrations';
import { normalizeIntegrationConnection } from '../../types/integrations';
import {
  canInitiateHubApiConnect,
  connectionCountsAsHubConnected,
  hubStatusLabel,
  type IntegrationRegistryEntry,
} from '../../integrations/integrationRegistry';
import { formatLastSync, testConnectionProvider } from '../../lib/integrations/client';
import { Modal } from '../ui/Modal';

interface ProviderCardProps {
  entry: IntegrationRegistryEntry;
  connection?: IntegrationConnection;
  /** Route-mode integrations (Meta, forms.app list). */
  routeConnected?: boolean;
  onConnect: (apiKey: string, accountLabel?: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSync: () => Promise<void>;
  onTest?: () => Promise<void>;
  busy?: boolean;
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
  routeConnected,
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

  const apiConnected = connectionCountsAsHubConnected(entry, conn);
  const staleLegacy =
    Boolean(conn) &&
    !apiConnected &&
    entry.hubConnectMode === 'api' &&
    (conn?.status === 'connected' || conn?.status === 'mock' || conn?.status === 'sandbox');

  const connected =
    entry.hubConnectMode === 'route' ? Boolean(routeConnected) : apiConnected;
  const hasError = conn?.status === 'error' && !staleLegacy;
  const comingSoon = entry.lifecycleStatus === 'coming_soon';
  const isDualKey = entry.credentialFields === 'dual';
  const mockOnly = entry.id === 'mock_finance';
  const canConnectApi = canInitiateHubApiConnect(entry);
  const routeMode = entry.hubConnectMode === 'route' && entry.managementRoute;

  const statusText = hubStatusLabel(entry, {
    apiConnected,
    routeConnected,
    staleLegacyConnection: staleLegacy,
  });

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
    if (!isDualKey && !credential) {
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
    if (!conn || !apiConnected) return;
    setTestMsg(null);
    const result = await testConnectionProvider({
      connectionId: conn.id,
      businessId: conn.businessId,
      provider: conn.providerId,
    });
    setTestMsg(result.message ?? (result.ok ? 'החיבור תקין' : 'שגיאה'));
  };

  const cardClass = [
    'provider-card',
    connected ? 'provider-card--connected' : '',
    hasError ? 'provider-card--error' : '',
    comingSoon ? 'provider-card--soon' : '',
    staleLegacy ? 'provider-card--stale' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <article
        className={cardClass}
        style={{ '--provider-color': entry.brandColor } as React.CSSProperties}
      >
        <div className="provider-card-head">
          <span className="provider-card-logo" aria-hidden>
            {entry.logoEmoji}
          </span>
          <div className="provider-card-info">
            <strong>{entry.nameHe}</strong>
            <p>{entry.description}</p>
          </div>
          <div className="provider-chip-col">
            <span
              className={`provider-status ${connected ? 'provider-status--on' : comingSoon ? 'provider-status--soon' : hasError ? 'provider-status--err' : ''}`}
            >
              {statusText}
            </span>
            {conn && apiConnected && (
              <span className="provider-mode-chip">{modeLabel(conn.mode)}</span>
            )}
          </div>
        </div>

        {comingSoon && (
          <p className="provider-coming-soon">בקרוב — עדיין לא ניתן להתחבר</p>
        )}

        {staleLegacy && (
          <p className="provider-coming-soon">
            נמצא חיבור ישן שלא נתמך — נתקו כדי להמשיך.
          </p>
        )}

        {conn && (apiConnected || staleLegacy) && (
          <div className="provider-card-meta">
            {apiConnected && (
              <span>סנכרון אחרון: {formatLastSync(conn.lastSyncAt ?? conn.lastSync)}</span>
            )}
            {conn.accountLabel && apiConnected && <span> · {conn.accountLabel}</span>}
            {conn.lastError && <p className="provider-card-error">{conn.lastError}</p>}
            {testMsg && <p className="field-hint">{testMsg}</p>}
          </div>
        )}

        <div className="provider-card-actions">
          {routeMode ? (
            <Link
              to={entry.managementRoute!}
              className={`btn btn-sm ${connected ? 'btn-ghost' : 'btn-primary'}`}
            >
              {connected ? 'ניהול חיבור' : entry.connectCtaLabel}
            </Link>
          ) : staleLegacy ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={() => void onDisconnect()}
            >
              ניתוק חיבור ישן
            </button>
          ) : connected && apiConnected ? (
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
          ) : comingSoon || !canConnectApi ? (
            <span className="provider-unavailable-hint">לא זמין כרגע</span>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={busy}
              onClick={() => setShowConnect(true)}
            >
              {entry.connectCtaLabel}
            </button>
          )}
        </div>
      </article>

      {canConnectApi && (
        <Modal
          open={showConnect}
          onClose={() => setShowConnect(false)}
          title={mockOnly ? entry.connectCtaLabel : `חיבור ${entry.nameHe}`}
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
            {!mockOnly && !isDualKey && (
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
              {entry.connectCtaLabel}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
