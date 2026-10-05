/** Normalize Vercel catch-all / dynamic segment query params to path segments. */
export function vercelPathSegments(
  query: Record<string, string | string[] | undefined>,
  ...keys: string[]
): string[] {
  for (const key of keys) {
    const raw = query[key];
    if (raw == null || raw === '') continue;
    if (Array.isArray(raw)) {
      return raw.map((s) => String(s).trim()).filter(Boolean);
    }
    const single = String(raw).trim();
    if (single.includes('/')) {
      return single.split('/').map((s) => s.trim()).filter(Boolean);
    }
    return [single];
  }
  return [];
}
