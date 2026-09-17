import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleMetaOAuthCallback } from '../../../../src/server/integrations/meta/metaOAuth.service';

function queryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
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
