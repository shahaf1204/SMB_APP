import { afterEach, describe, expect, it } from 'vitest';
import {
  decryptIntegrationSecret,
  encryptIntegrationSecret,
} from './integrationSecrets.server';

const TEST_KEY = 'test-integration-encryption-key-phase-3a1';

describe('integrationSecrets.server', () => {
  afterEach(() => {
    delete process.env.INTEGRATION_ENCRYPTION_KEY;
  });

  it('H. encrypt/decrypt round trip', () => {
    process.env.INTEGRATION_ENCRYPTION_KEY = TEST_KEY;
    const plain = 'EAAmeta-page-access-token-example';
    const stored = encryptIntegrationSecret(plain);
    expect(decryptIntegrationSecret(stored)).toBe(plain);
  });

  it('I. encrypted output does not contain plaintext token', () => {
    process.env.INTEGRATION_ENCRYPTION_KEY = TEST_KEY;
    const plain = 'super-secret-meta-token-value';
    const stored = encryptIntegrationSecret(plain);
    expect(stored.startsWith('v1:')).toBe(true);
    expect(stored.includes(plain)).toBe(false);
  });

  it('J. wrong encryption key fails safely on v1 payload', () => {
    process.env.INTEGRATION_ENCRYPTION_KEY = TEST_KEY;
    const stored = encryptIntegrationSecret('token-a');
    process.env.INTEGRATION_ENCRYPTION_KEY = 'different-key';
    expect(() => decryptIntegrationSecret(stored)).toThrow();
  });

  it('L. legacy base64 Meta tokens still decrypt', () => {
    const legacyPlain = 'legacy-meta-token';
    const legacyStored = Buffer.from(legacyPlain, 'utf8').toString('base64');
    expect(decryptIntegrationSecret(legacyStored)).toBe(legacyPlain);
  });
});
