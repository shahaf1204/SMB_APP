import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiAuthError, assertUserOwnsBusiness, requireApiUser } from '../../../../src/server/core/apiAuth.server';
import {
  assertNoSecretsInClientPayload,
  completeMetaOAuthPageSelection,
  metaOAuthErrorToClient,
} from '../../../../src/server/integrations/meta/metaOAuth.service';
import { MetaOAuthError } from '../../../../src/server/integrations/meta/metaOAuth.errors';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
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
