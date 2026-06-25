import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plug } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { ProviderCard } from '../components/integrations/ProviderCard';
import { CATEGORY_LABELS, catalogByCategory } from '../integrations/catalog';
import type { IntegrationCategory } from '../types/integrations';
import {
  connectProvider,
  disconnectProvider,
  syncProvider,
} from '../lib/integrations/client';
import { useAppStore } from '../store/useAppStore';

const CATEGORIES: IntegrationCategory[] = ['finance', 'calendar', 'marketing', 'communication'];

export function ConnectionsPage() {
  const business = useAppStore((s) => s.business)!;
  const user = useAppStore((s) => s.user)!;
  const connections = useAppStore((s) => s.integrationConnections);
  const upsertIntegrationConnection = useAppStore((s) => s.upsertIntegrationConnection);
  const removeIntegrationConnection = useAppStore((s) => s.removeIntegrationConnection);
  const updateIntegrationSync = useAppStore((s) => s.updateIntegrationSync);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const byProvider = useMemo(() => {
    const map = new Map<string, (typeof connections)[0]>();
    for (const c of connections) {
      if (c.businessId === business.id) map.set(c.provider, c);
    }
    return map;
  }, [connections, business.id]);

  const handleConnect = async (provider: string, apiKey: string, accountLabel?: string) => {
    setBusyId(provider);
    setGlobalError(null);
    try {
      const connection = await connectProvider({
        businessId: business.id,
        userId: user.id,
        provider: provider as never,
        apiKey,
        accountLabel,
      });
      upsertIntegrationConnection(connection);
    } finally {
      setBusyId(null);
    }
  };

  const handleDisconnect = async (connectionId: string, provider: string) => {
    setBusyId(provider);
    try {
      await disconnectProvider({ connectionId, businessId: business.id });
      removeIntegrationConnection(connectionId);
    } finally {
      setBusyId(null);
    }
  };

  const handleSync = async (connectionId: string, provider: string) => {
    setBusyId(provider);
    updateIntegrationSync(connectionId, { syncStatus: 'syncing' });
    try {
      const result = await syncProvider({ connectionId, businessId: business.id });
      updateIntegrationSync(connectionId, {
        syncStatus: result.ok ? 'success' : 'error',
        lastSync: result.syncedAt,
        lastError: result.error,
        connectionStatus: result.ok ? 'connected' : 'error',
      });
    } catch (e) {
      updateIntegrationSync(connectionId, {
        syncStatus: 'error',
        lastError: e instanceof Error ? e.message : 'Sync failed',
        connectionStatus: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/settings" className="back-link">
          ← הגדרות
        </Link>
        <div className="page-top-row">
          <h1 className="page-title">חיבורים</h1>
          <Plug size={22} className="text-muted" aria-hidden />
        </div>
        <p className="page-subtitle">
          מרכז האינטגרציות — חברו את המערכות שכבר בשימוש
        </p>

        {globalError && <p className="import-feedback">{globalError}</p>}

        {CATEGORIES.map((cat) => (
          <section key={cat} className="connections-category">
            <h2 className="section-title-sm">{CATEGORY_LABELS[cat]}</h2>
            <div className="provider-card-grid">
              {catalogByCategory(cat).map((entry) => {
                const conn = byProvider.get(entry.id);
                return (
                  <ProviderCard
                    key={entry.id}
                    entry={entry}
                    connection={conn}
                    busy={busyId === entry.id}
                    onConnect={(key, label) => handleConnect(entry.id, key, label)}
                    onDisconnect={() =>
                      conn ? handleDisconnect(conn.id, entry.id) : Promise.resolve()
                    }
                    onSync={() => (conn ? handleSync(conn.id, entry.id) : Promise.resolve())}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
