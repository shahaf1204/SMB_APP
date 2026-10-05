import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { vercelPathSegments } from './vercelPathParams.js';

const ROOT = path.resolve(import.meta.dirname, '../../..');

function listApiDefaultExports(): string[] {
  const apiDir = path.join(ROOT, 'api');
  const out: string[] = [];
  function walk(dir: string) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(name) && /\bexport\s+default\s+/.test(fs.readFileSync(full, 'utf8'))) {
        out.push(path.relative(ROOT, full).replace(/\\/g, '/'));
      }
    }
  }
  walk(apiDir);
  return out.sort();
}

describe('consolidated API routing', () => {
  it('maps finance integration paths', () => {
    expect(vercelPathSegments({ path: 'connect' }, 'path', 'action')).toEqual(['connect']);
    expect(vercelPathSegments({ path: ['invoice', 'push'] }, 'path', 'action')).toEqual([
      'invoice',
      'push',
    ]);
  });

  it('maps external-forms actions', () => {
    expect(vercelPathSegments({ action: 'register' }, 'action')).toEqual(['register']);
    expect(vercelPathSegments({ action: 'poll' }, 'action')).toEqual(['poll']);
  });

  it('maps meta oauth steps', () => {
    for (const step of ['start', 'attempt', 'callback', 'select-page'] as const) {
      expect(vercelPathSegments({ step }, 'step')[0]).toBe(step);
    }
  });

  it('keeps serverless function count at or below Hobby headroom (≤10)', () => {
    const fns = listApiDefaultExports();
    expect(fns).toContain('api/webhooks/meta/leadgen.ts');
    expect(fns).toContain('api/integrations/meta/oauth/[[...step]].ts');
    expect(fns).toContain('api/integrations/[[...path]].ts');
    expect(fns).toContain('api/external-forms/[[...action]].ts');
    expect(fns).not.toContain('api/integrations/[action].ts');
    expect(fns).not.toContain('api/integrations/meta/oauth/callback.ts');
    expect(fns.length).toBeLessThanOrEqual(10);
  });
});
