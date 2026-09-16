import type { MetaConnection, MetaConnectionStatus } from '../../types/crm';
import { getSupabase, isSupabaseConfigured } from '../supabase';

export function getMetaWebhookUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/api/webhooks/meta/leadgen`;
}

function normalizeConnectionStatus(raw: unknown): MetaConnectionStatus {
  const allowed: MetaConnectionStatus[] = [
    'disconnected',
    'connecting',
    'connected',
    'error',
    'reconnect_required',
  ];
  if (typeof raw === 'string' && (allowed as string[]).includes(raw)) {
    return raw as MetaConnectionStatus;
  }
  return 'disconnected';
}

function mapMetaConnectionRow(data: Record<string, unknown>): MetaConnection {
  return {
    id: data.id as string,
    ownerId: data.user_id as string,
    businessId: data.business_id as string,
    pageId: data.page_id as string,
    pageName: data.page_name as string,
    isActive: Boolean(data.is_active),
    connectionStatus: normalizeConnectionStatus(data.connection_status),
    lastError: (data.last_error as string | null) ?? undefined,
    lastLeadReceivedAt: (data.last_lead_received_at as string | null) ?? undefined,
    webhookSubscribedAt: (data.webhook_subscribed_at as string | null) ?? undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

const META_CONNECTION_PUBLIC_COLUMNS =
  'id, user_id, business_id, page_id, page_name, is_active, connection_status, last_error, last_lead_received_at, webhook_subscribed_at, created_at, updated_at';

export async function fetchMetaConnection(
  userId: string,
  businessId: string,
): Promise<MetaConnection | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabase()
    .from('meta_connections')
    .select(META_CONNECTION_PUBLIC_COLUMNS)
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return mapMetaConnectionRow(data as Record<string, unknown>);
}

export async function saveMetaConnectionPending(
  userId: string,
  businessId: string,
  pageId: string,
  pageName: string,
): Promise<MetaConnection | null> {
  if (!isSupabaseConfigured()) return null;
  const now = new Date().toISOString();
  const { data, error } = await getSupabase()
    .from('meta_connections')
    .upsert(
      {
        user_id: userId,
        business_id: businessId,
        page_id: pageId.trim(),
        page_name: pageName.trim(),
        is_active: false,
        updated_at: now,
      },
      { onConflict: 'page_id' },
    )
    .select(META_CONNECTION_PUBLIC_COLUMNS)
    .single();

  if (error || !data) return null;

  return mapMetaConnectionRow(data as Record<string, unknown>);
}

export async function disconnectMetaConnection(connectionId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await getSupabase().from('meta_connections').delete().eq('id', connectionId);
  return !error;
}

export function getMetaOAuthUrl(appId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'pages_show_list,pages_read_engagement,leads_retrieval,pages_manage_metadata',
    response_type: 'code',
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}
