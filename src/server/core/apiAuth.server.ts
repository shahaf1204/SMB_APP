import type { VercelRequest } from '@vercel/node';
import { getSupabaseAdminOptional } from './supabase.server';

export class ApiAuthError extends Error {
  constructor(
    readonly httpStatus: number,
    readonly code: string,
  ) {
    super(code);
    this.name = 'ApiAuthError';
  }
}

export interface AuthenticatedApiUser {
  userId: string;
  email?: string;
}

function bearerToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

export async function requireApiUser(req: VercelRequest): Promise<AuthenticatedApiUser> {
  const token = bearerToken(req);
  if (!token) {
    throw new ApiAuthError(401, 'authorization_required');
  }

  const supabase = getSupabaseAdminOptional();
  if (!supabase) {
    throw new ApiAuthError(503, 'server_not_configured');
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.id) {
    throw new ApiAuthError(401, 'invalid_token');
  }

  return { userId: data.user.id, email: data.user.email ?? undefined };
}

async function userOwnsBusinessViaSnapshot(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminOptional>>,
  userId: string,
  businessId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('app_snapshots')
    .select('snapshot')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return false;
  const snapshot = data?.snapshot as { business?: { id?: string } } | null | undefined;
  return snapshot?.business?.id?.trim() === businessId;
}

/** Fallback when cloud snapshot not yet synced — existing CRM/Meta rows for same user. */
async function userOwnsBusinessViaExistingRows(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminOptional>>,
  userId: string,
  businessId: string,
): Promise<boolean> {
  const { data: metaRow } = await supabase
    .from('meta_connections')
    .select('id')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .limit(1)
    .maybeSingle();
  if (metaRow) return true;

  const { data: leadRow } = await supabase
    .from('crm_leads')
    .select('id')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .limit(1)
    .maybeSingle();
  return Boolean(leadRow);
}

/**
 * Ensures businessId belongs to the authenticated user.
 * Primary: app_snapshots (authoritative cloud mirror). Fallback: meta_connections / crm_leads
 * for same user+business when snapshot lag exists (local-first sync model).
 */
export async function assertUserOwnsBusiness(userId: string, businessId: string): Promise<void> {
  const trimmed = businessId.trim();
  if (!trimmed) {
    throw new ApiAuthError(400, 'business_required');
  }

  const supabase = getSupabaseAdminOptional();
  if (!supabase) {
    throw new ApiAuthError(503, 'server_not_configured');
  }

  if (await userOwnsBusinessViaSnapshot(supabase, userId, trimmed)) {
    return;
  }

  if (await userOwnsBusinessViaExistingRows(supabase, userId, trimmed)) {
    return;
  }

  const { data: snapshotRow } = await supabase
    .from('app_snapshots')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!snapshotRow) {
    throw new ApiAuthError(403, 'business_snapshot_missing');
  }

  throw new ApiAuthError(403, 'business_access_denied');
}
