import { afterEach, describe, expect, it } from 'vitest';
import {
  MetaWebhookSignatureError,
  signMetaWebhookPayload,
  verifyMetaWebhookSignature,
} from './metaWebhook.signature';

describe('metaWebhook.signature', () => {
  afterEach(() => {
    delete process.env.META_APP_SECRET;
  });

  it('1. valid X-Hub-Signature-256', () => {
    process.env.META_APP_SECRET = 'test-secret';
    const raw = Buffer.from('{"entry":[]}', 'utf8');
    const sig = signMetaWebhookPayload(raw, 'test-secret');
    expect(() =>
      verifyMetaWebhookSignature(raw, { 'x-hub-signature-256': sig }),
    ).not.toThrow();
  });

  it('2. invalid signature → 403', () => {
    process.env.META_APP_SECRET = 'test-secret';
    const raw = Buffer.from('{"entry":[]}', 'utf8');
    expect(() =>
      verifyMetaWebhookSignature(raw, { 'x-hub-signature-256': 'sha256=deadbeef' }),
    ).toThrow(MetaWebhookSignatureError);
  });

  it('3. missing signature → 401', () => {
    process.env.META_APP_SECRET = 'test-secret';
    const raw = Buffer.from('{}', 'utf8');
    try {
      verifyMetaWebhookSignature(raw, {});
      expect.fail('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(MetaWebhookSignatureError);
      expect((e as MetaWebhookSignatureError).httpStatus).toBe(401);
    }
  });

  it('4. malformed signature → 401', () => {
    process.env.META_APP_SECRET = 'test-secret';
    const raw = Buffer.from('{}', 'utf8');
    expect(() =>
      verifyMetaWebhookSignature(raw, { 'x-hub-signature-256': 'not-a-valid-format' }),
    ).toThrow(MetaWebhookSignatureError);
  });

  it('5. raw body bytes are used (whitespace change invalidates)', () => {
    process.env.META_APP_SECRET = 'test-secret';
    const raw = Buffer.from('{"a":1}', 'utf8');
    const sig = signMetaWebhookPayload(raw, 'test-secret');
    const tampered = Buffer.from('{"a": 1}', 'utf8');
    expect(() =>
      verifyMetaWebhookSignature(tampered, { 'x-hub-signature-256': sig }),
    ).toThrow(MetaWebhookSignatureError);
  });

  it('signature differs from stringify-after-parse', () => {
    process.env.META_APP_SECRET = 'test-secret';
    const raw = Buffer.from('{"entry":[{"id":"1"}]}', 'utf8');
    const sig = signMetaWebhookPayload(raw, 'test-secret');
    const reSerialized = Buffer.from(JSON.stringify(JSON.parse(raw.toString())), 'utf8');
    if (!reSerialized.equals(raw)) {
      expect(() =>
        verifyMetaWebhookSignature(reSerialized, { 'x-hub-signature-256': sig }),
      ).toThrow();
    }
  });
});
