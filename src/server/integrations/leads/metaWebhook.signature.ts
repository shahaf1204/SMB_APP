import { timingSafeEqual, createHmac } from 'crypto';
import { getMetaAppSecret } from '../../core/supabase.server';

const SIGNATURE_HEADER = 'x-hub-signature-256';
const PREFIX = 'sha256=';

export class MetaWebhookSignatureError extends Error {
  readonly httpStatus: 401 | 403;

  constructor(message: string, httpStatus: 401 | 403) {
    super(message);
    this.name = 'MetaWebhookSignatureError';
    this.httpStatus = httpStatus;
  }
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const direct = headers[name];
  if (typeof direct === 'string') return direct;
  if (Array.isArray(direct)) return direct[0];
  const lower = headers[name.toLowerCase()];
  if (typeof lower === 'string') return lower;
  if (Array.isArray(lower)) return lower[0];
  return undefined;
}

function safeEqualHex(expectedHex: string, providedHex: string): boolean {
  try {
    const expected = Buffer.from(expectedHex, 'hex');
    const provided = Buffer.from(providedHex, 'hex');
    if (expected.length !== provided.length) return false;
    return timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

/**
 * Verify Meta X-Hub-Signature-256 over the exact raw request body bytes.
 * Must run before JSON parsing for production verification.
 */
export function verifyMetaWebhookSignature(
  rawBody: Buffer,
  headers: Record<string, string | string[] | undefined>,
): void {
  const appSecret = getMetaAppSecret()?.trim();
  if (!appSecret) {
    throw new MetaWebhookSignatureError('Meta webhook app secret not configured', 403);
  }

  const header = headerValue(headers, SIGNATURE_HEADER);
  if (!header) {
    throw new MetaWebhookSignatureError('Missing X-Hub-Signature-256 header', 401);
  }

  if (!header.startsWith(PREFIX)) {
    throw new MetaWebhookSignatureError('Malformed X-Hub-Signature-256 header', 401);
  }

  const providedDigest = header.slice(PREFIX.length).trim();
  if (!/^[a-f0-9]+$/i.test(providedDigest)) {
    throw new MetaWebhookSignatureError('Malformed X-Hub-Signature-256 digest', 401);
  }

  const expectedDigest = createHmac('sha256', appSecret).update(rawBody).digest('hex');
  if (!safeEqualHex(expectedDigest, providedDigest)) {
    throw new MetaWebhookSignatureError('Invalid webhook signature', 403);
  }
}

/** Test helper — compute signature for fixtures. Server/tests only. */
export function signMetaWebhookPayload(rawBody: Buffer, appSecret: string): string {
  const digest = createHmac('sha256', appSecret).update(rawBody).digest('hex');
  return `${PREFIX}${digest}`;
}
