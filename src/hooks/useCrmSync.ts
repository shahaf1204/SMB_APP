import { useEffect, useState } from 'react';
import type { MetaConnection } from '../types/crm';
import { fetchCrmLeadsFromCloud, mergeCloudLeadsIntoStore } from '../lib/crm/leadsSync';
import { fetchMetaConnection } from '../lib/crm/metaConnection';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export function useCrmSync(): {
  metaConnection: MetaConnection | null;
  metaLoading: boolean;
  refreshMeta: () => Promise<void>;
  syncLeads: () => Promise<void>;
} {
  const user = useAppStore((s) => s.user);
  const business = useAppStore((s) => s.business);
  const upsertCloudLead = useAppStore((s) => s.upsertCloudLead);
  const [metaConnection, setMetaConnection] = useState<MetaConnection | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);

  const refreshMeta = async () => {
    if (!user?.id || !business?.id || !isSupabaseConfigured()) {
      setMetaConnection(null);
      setMetaLoading(false);
      return;
    }
    setMetaLoading(true);
    const conn = await fetchMetaConnection(user.id, business.id);
    setMetaConnection(conn);
    setMetaLoading(false);
  };

  const syncLeads = async () => {
    if (!user?.id || !business?.id || !isSupabaseConfigured()) return;
    const cloudLeads = await fetchCrmLeadsFromCloud(user.id, business.id);
    mergeCloudLeadsIntoStore(cloudLeads, useAppStore.getState().leads, upsertCloudLead);
  };

  useEffect(() => {
    void refreshMeta();
  }, [user?.id, business?.id]);

  useEffect(() => {
    void syncLeads();
    if (!isSupabaseConfigured()) return;
    const interval = setInterval(() => void syncLeads(), 60_000);
    return () => clearInterval(interval);
  }, [user?.id, business?.id]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshMeta();
        void syncLeads();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.id, business?.id]);

  return { metaConnection, metaLoading, refreshMeta, syncLeads };
}
