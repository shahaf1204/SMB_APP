import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

export function getMetaVerifyToken(): string {
  return process.env.META_WEBHOOK_VERIFY_TOKEN ?? '';
}

export function getMetaAppSecret(): string | undefined {
  return process.env.META_APP_SECRET;
}

export function getMetaGraphVersion(): string {
  return process.env.META_GRAPH_VERSION ?? 'v21.0';
}

/** הצפנה בסיסית — להחלפה ב-KMS ב-production */
export function encryptToken(token: string): string {
  return Buffer.from(token, 'utf8').toString('base64');
}

export function decryptToken(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf8');
}
