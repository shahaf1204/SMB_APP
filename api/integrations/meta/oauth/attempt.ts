import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiAuthError, assertUserOwnsBusiness, requireApiUser } from '../../../../src/server/core/apiAuth.server';
import {
  assertNoSecretsInClientPayload,
  getSafeMetaOAuthPageCandidates,
  metaOAuthErrorToClient,
} from '../../../../src/server/integrations/meta/metaOAuth.service';
import { MetaOAuthError } from '../../../../src/server/integrations/meta/metaOAuth.errors';

function queryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
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
