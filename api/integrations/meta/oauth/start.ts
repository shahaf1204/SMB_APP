import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiAuthError, assertUserOwnsBusiness, requireApiUser } from '../../../../src/server/core/apiAuth.server';
import {
  metaOAuthErrorToClient,
  startMetaOAuthAuthorization,
} from '../../../../src/server/integrations/meta/metaOAuth.service';
import { MetaOAuthError } from '../../../../src/server/integrations/meta/metaOAuth.errors';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
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
