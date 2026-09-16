/**
 * Meta leadgen webhook routing contract (Phase 3A.2).
 *
 * POST must hit the dedicated Vercel function with `bodyParser: false` so
 * X-Hub-Signature-256 is verified over raw bytes. The catch-all slug route
 * cannot preserve raw body and must not process leadgen POST payloads.
 */

export const META_LEADGEN_DEDICATED_PATH = '/api/webhooks/meta/leadgen';

/** HTTP status for POST on legacy catch-all `/api/webhooks/meta/leadgen` via [[...slug]]. */
export const META_LEADGEN_LEGACY_POST_STATUS = 410 as const;

export const META_LEADGEN_LEGACY_POST_ERROR =
  'Meta leadgen POST moved to /api/webhooks/meta/leadgen (raw body + signature verification)';
