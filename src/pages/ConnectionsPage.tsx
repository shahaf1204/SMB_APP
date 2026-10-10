import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plug } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { IntegrationDevPanel } from '../components/integrations/IntegrationDevPanel';
import { ProviderCard } from '../components/integrations/ProviderCard';
import {
  HUB_CATEGORY_LABELS,
  HUB_CATEGORY_ORDER,
  hubEntriesByCategory,
  type ConnectionsScope,
} from '../integrations/integrationRegistry';
import type { ProviderId } from '../types/integrations';
import { normalizeIntegrationConnection } from '../types/integrations';
import {
  connectProvider,
  disconnectProvider,
  syncProvider,
} from '../lib/integrations/client';
import { getActiveFinanceConnection } from '../lib/integrations/service';
import { useAppStore } from '../store/useAppStore';

function parseScope(raw: string | null): ConnectionsScope | undefined {
  if (raw === 'invoicing' || raw === 'payments') return raw;
  return undefined;
}

export function ConnectionsPage() {
  const [searchParams] = useSearchParams();
  const scope = parseScope(searchParams.get('scope'));

  const business = useAppStore((s) => s.business)!;
  const user = useAppStore((s) => s.user)!;
  const connections = useAppStore((s) => s.integrationConnections);
  const externalFormConnections = useAppStore((s) => s.externalFormConnections);
  const upsertIntegrationConnection = useAppStore((s) => s.upsertIntegrationConnection);
  const removeIntegrationConnection = useAppStore((s) => s.removeIntegrationConnection);
  const updateIntegrationSync = useAppStore((s) => s.updateIntegrationSync);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const normalized = useMemo(
    () =>
      connections
        .filter((c) => c.businessId === business.id)
        .map((c) => normalizeIntegrationConnection(c as never)),
    [connections, business.id],
  );

  const byProvider = useMemo(() => {
    const map = new Map<string, (typeof normalized)[0]>();
    for (const c of normalized) map.set(c.providerId, c);
    return map;
  }, [normalized]);

  const financeConn = getActiveFinanceConnection(connections, business.id);

  const categories = useMemo(() => hubEntriesByCategory(scope), [scope]);

  const formsAppConnected = useMemo(
    () =>
      externalFormConnections.some(
        (c) => c.businessId === business.id && c.provider === 'forms_app' && c.isActive,
      ),
    [externalFormConnections, business.id],
  );

  const pageTitle =
    scope === 'invoicing'
      ? 'חיבור ספק חשבוניות'
      : scope === 'payments'
        ? 'חיבור סליקה'
        : 'חיבורים';

  const backTo = scope === 'invoicing' ? '/invoices' : '/settings';

  const handleConnect = async (provider: string, apiKey: string, accountLabel?: string) => {
    setBusyId(provider);
    setGlobalError(null);
    try {
      const connection = await connectProvider({
        businessId: business.id,
        userId: user.id,
        provider: provider as ProviderId,
        apiKey,
        accountLabel,
      });
      upsertIntegrationConnection(connection);
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : 'שגיאת חיבור');
      throw e;
    } finally {
      setBusyId(null);
    }
  };

  const handleDisconnect = async (connectionId: string, provider: string) => {
    setBusyId(provider);
    try {
      await disconnectProvider({ connectionId, businessId: business.id, provider: provider as ProviderId });
      removeIntegrationConnection(connectionId);
    } finally {
      setBusyId(null);
    }
  };

  const handleSync = async (connectionId: string, provider: string) => {
    setBusyId(provider);
    updateIntegrationSync(connectionId, { syncStatus: 'syncing' });
    try {
      const result = await syncProvider({
        connectionId,
        businessId: business.id,
        provider: provider as ProviderId,
      });
      updateIntegrationSync(connectionId, {
        syncStatus: result.ok ? 'success' : 'error',
        lastSyncAt: result.syncedAt,
        lastError: result.error,
        status: result.ok ? 'connected' : 'error',
      });
    } catch (e) {
      updateIntegrationSync(connectionId, {
        syncStatus: 'error',
        lastError: e instanceof Error ? e.message : 'Sync failed',
        status: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const visibleCategories = scope
    ? HUB_CATEGORY_ORDER.filter((cat) => categories.has(cat))
    : HUB_CATEGORY_ORDER;

  return (
    <div className="app-shell">
      <div className="page">
        <Link to={backTo} className="back-link">
          {scope === 'invoicing' ? '← חשבוניות' : '← הגדרות'}
        </Link>
        <div className="page-top-row">
          <h1 className="page-title">{pageTitle}</h1>
          <Plug size={22} className="text-muted" aria-hidden />
        </div>
        <p className="page-subtitle">
          {scope === 'invoicing'
            ? 'בחרו ספק חשבוניות להפקת מסמכים רשמיים — לא מוצגים כאן מקורות לידים, יומן או תקשורת.'
            : scope === 'payments'
              ? 'ספקי סליקה ותשלומים — נפרד מספקי חשבוניות.'
              : 'מרכז האינטגרציות — חברו את הכלים שכבר בשימוש ונהלו הכל ממקום אחד'}
        </p>

        {globalError && <p className="import-feedback">{globalError}</p>}

        {visibleCategories.map((cat) => {
          const entries = categories.get(cat);
          if (!entries?.length) return null;
          return (
            <section key={cat} className="connections-category">
              <h2 className="section-title-sm">{HUB_CATEGORY_LABELS[cat] ?? cat}</h2>
              <div className="provider-card-grid">
                {entries.map((entry) => {
                  const conn = byProvider.get(entry.id as string);
                  const routeConnected =
                    entry.id === 'forms_app'
                      ? formsAppConnected
                      : entry.id === 'meta_leads'
                        ? false
                        : undefined;
                  return (
                    <ProviderCard
                      key={entry.id}
                      entry={entry}
                      connection={conn}
                      routeConnected={routeConnected}
                      busy={busyId === entry.id}
                      onConnect={(key, label) => handleConnect(entry.id as string, key, label)}
                      onDisconnect={() =>
                        conn ? handleDisconnect(conn.id, entry.id as string) : Promise.resolve()
                      }
                      onSync={() =>
                        conn ? handleSync(conn.id, entry.id as string) : Promise.resolve()
                      }
                    />
                  );
                })}
              </div>
            </section>
          );
        })}

        {!scope && (
          <p className="field-hint" style={{ marginTop: '1rem' }}>
            Meta Leads ו-forms.app מנוהלים גם תחת{' '}
            <Link to="/sources">מקורות כניסה</Link>.
          </p>
        )}

        <IntegrationDevPanel businessId={business.id} financeConnection={financeConn} />
      </div>
      <BottomNav />
    </div>
  );
}
