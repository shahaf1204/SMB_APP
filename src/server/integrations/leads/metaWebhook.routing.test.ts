import { describe, expect, it } from 'vitest';
import {
  META_LEADGEN_DEDICATED_PATH,
  META_LEADGEN_LEGACY_POST_ERROR,
  META_LEADGEN_LEGACY_POST_STATUS,
} from './metaWebhook.routing';

describe('Meta leadgen webhook routing contract', () => {
  it('dedicated POST path is documented canonical endpoint', () => {
    expect(META_LEADGEN_DEDICATED_PATH).toBe('/api/webhooks/meta/leadgen');
  });

  it('legacy catch-all POST is rejected with 410 (no unsigned processing)', () => {
    expect(META_LEADGEN_LEGACY_POST_STATUS).toBe(410);
    expect(META_LEADGEN_LEGACY_POST_ERROR).toMatch(/raw body/i);
  });

  it('dedicated route disables Vercel body parser for raw signature bytes', async () => {
    const mod = await import('../../../../api/webhooks/meta/leadgen');
    expect(mod.config?.api?.bodyParser).toBe(false);
  });
});
