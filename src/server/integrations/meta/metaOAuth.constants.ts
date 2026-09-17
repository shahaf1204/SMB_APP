/** OAuth CSRF state lifetime — bound to user/business, one-time use. */
export const META_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

/** Short-lived server attempt between callback and Page selection. */
export const META_OAUTH_ATTEMPT_TTL_MS = 15 * 60 * 1000;

export const META_OAUTH_FRONTEND_RETURN_PATH = '/sources/leads';

/**
 * Retention: expired/consumed OAuth rows are logically dead (TTL + atomic consume).
 * No cron in 3A.3.1 — future job may DELETE FROM meta_oauth_states WHERE expires_at < now() - interval '7 days'
 * and meta_oauth_attempts WHERE consumed_at IS NOT NULL AND consumed_at < now() - interval '7 days'.
 * Successful finalization clears pages_payload_encrypted on attempts.
 */
export const META_OAUTH_DATA_RETENTION_POLICY = 'logical-expiry-only-v1';
