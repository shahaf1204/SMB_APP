import type { MetaConnection } from '../../types/crm';
import { getSupabase, isSupabaseConfigured } from '../supabase';

export function getMetaWebhookUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/api/webhooks/meta/leadgen`;
}

export async function fetchMetaConnection(
  userId: string,
  businessId: string,
): Promise<MetaConnection | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabase()
    .from('meta_connections')
    .select('id, user_id, business_id, page_id, page_name, is_active, created_at, updated_at')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    ownerId: data.user_id,
    businessId: data.business_id,
    pageId: data.page_id,
    pageName: data.page_name,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
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
    .select('id, user_id, business_id, page_id, page_name, is_active, created_at, updated_at')
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    ownerId: data.user_id,
    businessId: data.business_id,
    pageId: data.page_id,
    pageName: data.page_name,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
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
