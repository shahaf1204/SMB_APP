# Meta Graph / Login API contract (Phase 3A.3)

**Status: deployment-verified-required.** Official Meta documentation was not machine-verified in CI. Operators must confirm endpoints, scopes, and App Review requirements in [Meta for Developers](https://developers.facebook.com/docs/graph-api) before production.

## Version

| Setting | Default | Notes |
|---------|---------|--------|
| `META_GRAPH_VERSION` | `v21.0` | Centralized in `getMetaGraphVersion()` (`supabase.server.ts`). Used by OAuth dialog, Graph REST, and webhook processor. **Not silently upgraded** — change env only after Meta changelog review. |

`v21.0` matches pre-3A.3 repository usage (`metaLead.service`, client `getMetaOAuthUrl`). Treat as intentional default, not an arbitrary pin.

## Endpoints (all prefixed with version)

| Step | URL pattern | Implementation |
|------|-------------|----------------|
| OAuth dialog | `https://www.facebook.com/{version}/dialog/oauth` | `metaFacebookOAuthDialogUrl()` |
| Code → token | `GET graph.facebook.com/{version}/oauth/access_token` | `exchangeMetaOAuthCode()` |
| Long-lived user token | Same, `grant_type=fb_exchange_token` | `exchangeMetaLongLivedUserToken()` |
| User id | `GET /me?fields=id` | `fetchMetaUserId()` |
| Page discovery | `GET /me/accounts?fields=id,name,access_token` | `fetchMetaManagedPages()` |
| Leadgen subscription | `POST /{page-id}/subscribed_apps?subscribed_fields=leadgen` | `subscribeMetaPageToLeadgen()` |

## Scopes (no speculative additions)

Configured in `META_OAUTH_SCOPES` (`meta.config.server.ts`):

- `pages_show_list`
- `pages_read_engagement`
- `leads_retrieval`
- `pages_manage_metadata`

**Manual verification before App Review:** Advanced Access requirements for `leads_retrieval` and `pages_manage_metadata`; app-level webhook product subscribed to `leadgen`; callback URL and redirect URI whitelisted in Meta app settings.

## Migration order (Supabase)

1. `schema.sql` — `app_snapshots`
2. `crm.sql` — `meta_connections`
3. `integration-external-events-3a1.sql` — ExternalEvent + connection columns
4. `meta-oauth-3a3.sql` — OAuth state/attempt tables + partial unique index

Re-run safe: `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` patterns.

**Index risk:** `meta_connections_one_active_per_business_idx` fails if multiple `is_active=true` rows exist per business — resolve duplicates before applying.
