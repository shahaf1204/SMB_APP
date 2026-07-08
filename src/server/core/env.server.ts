export function getServerEnv(name: string): string | undefined {
  const value = process.env[name];
  return value?.trim() || undefined;
}

export function getSupabaseServerEnv(): { url: string; serviceRoleKey: string } | null {
  const url = getServerEnv('SUPABASE_URL');
  const serviceRoleKey = getServerEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

export function deploymentUrlFromEnv(): string {
  const host = getServerEnv('VERCEL_URL');
  if (!host) return '';
  return host.startsWith('http') ? host : `https://${host}`;
}
