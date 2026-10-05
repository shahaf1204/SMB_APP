import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiAuthError, assertUserOwnsBusiness, requireApiUser } from '../../../../src/server/core/apiAuth.server.js';
import { vercelPathSegments } from '../../../../src/server/core/vercelPathParams.js';
import {
  assertNoSecretsInClientPayload,
  completeMetaOAuthPageSelection,
  getSafeMetaOAuthPageCandidates,
  handleMetaOAuthCallback,
  metaOAuthErrorToClient,
  startMetaOAuthAuthorization,
} from '../../../../src/server/integrations/meta/metaOAuth.service.js';
import { MetaOAuthError } from '../../../../src/server/integrations/meta/metaOAuth.errors.js';

function queryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function oauthStep(req: VercelRequest): string {
  const parts = vercelPathSegments(req.query as Record<string, string | string[] | undefined>, 'step');
  return parts[0] ?? '';
}

async function handleStart(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const user = await requireApiUser(req);
    const body = (req.body ?? {}) as { businessId?: string };
    const businessId = String(body.businessId ?? '').trim();
    if (!businessId) {
      res.status(400).json({ error: 'business_required' });
      return;
    }

    await assertUserOwnsBusiness(user.userId, businessId);
    const { authorizationUrl } = await startMetaOAuthAuthorization({
      userId: user.userId,
      businessId,
    });

    res.status(200).json({ authorizationUrl });
  } catch (e) {
    if (e instanceof ApiAuthError) {
      res.status(e.httpStatus).json({ error: e.code });
      return;
    }
    if (e instanceof MetaOAuthError) {
      const client = metaOAuthErrorToClient(e.code);
      res.status(400).json(client);
      return;
    }
    res.status(500).json({ error: 'oauth_start_failed' });
  }
}

async function handleAttempt(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const user = await requireApiUser(req);
    const attemptId = String(queryParam(req.query.attemptId) ?? '').trim();
    const businessId = String(queryParam(req.query.businessId) ?? '').trim();
    if (!attemptId || !businessId) {
      res.status(400).json({ error: 'missing_parameters' });
      return;
    }

    await assertUserOwnsBusiness(user.userId, businessId);
    const result = await getSafeMetaOAuthPageCandidates({
      attemptId,
      userId: user.userId,
      businessId,
    });
    assertNoSecretsInClientPayload(result);
    res.status(200).json(result);
  } catch (e) {
    if (e instanceof ApiAuthError) {
      res.status(e.httpStatus).json({ error: e.code });
      return;
    }
    if (e instanceof MetaOAuthError) {
      res.status(400).json(metaOAuthErrorToClient(e.code));
      return;
    }
    res.status(500).json({ error: 'attempt_load_failed' });
  }
}

async function handleCallback(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const { redirectUrl } = await handleMetaOAuthCallback({
      code: queryParam(req.query.code),
      state: queryParam(req.query.state),
      error: queryParam(req.query.error),
      error_reason: queryParam(req.query.error_reason),
    });
    res.redirect(302, redirectUrl);
  } catch {
    res.redirect(302, '/sources/leads?meta_oauth_error=authorization_failed');
  }
}

async function handleSelectPage(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const user = await requireApiUser(req);
    const body = (req.body ?? {}) as {
      attemptId?: string;
      pageId?: string;
      businessId?: string;
    };

    const attemptId = String(body.attemptId ?? '').trim();
    const pageId = String(body.pageId ?? '').trim();
    const businessId = String(body.businessId ?? '').trim();

    if (!attemptId || !pageId || !businessId) {
      res.status(400).json({ error: 'missing_parameters' });
      return;
    }

    await assertUserOwnsBusiness(user.userId, businessId);
    const result = await completeMetaOAuthPageSelection({
      attemptId,
      pageId,
      userId: user.userId,
      businessId,
    });
    assertNoSecretsInClientPayload(result);
    res.status(200).json(result);
  } catch (e) {
    if (e instanceof ApiAuthError) {
      res.status(e.httpStatus).json({ error: e.code });
      return;
    }
    if (e instanceof MetaOAuthError) {
      res.status(400).json(metaOAuthErrorToClient(e.code));
      return;
    }
    res.status(500).json({ error: 'page_selection_failed' });
  }
}

/** Meta OAuth — same public paths: /start, /attempt, /callback, /select-page */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  switch (oauthStep(req)) {
    case 'start':
      return handleStart(req, res);
    case 'attempt':
      return handleAttempt(req, res);
    case 'callback':
      return handleCallback(req, res);
    case 'select-page':
      return handleSelectPage(req, res);
    default:
      res.status(404).json({ error: 'unknown_oauth_step' });
  }
}
