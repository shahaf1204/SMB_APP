import { describe, expect, it } from 'vitest';
import { vercelPathSegments } from './vercelPathParams.js';

describe('vercelPathSegments', () => {
  it('reads catch-all path arrays', () => {
    expect(vercelPathSegments({ path: ['invoice', 'push'] }, 'path')).toEqual(['invoice', 'push']);
  });

  it('reads single dynamic segment as action', () => {
    expect(vercelPathSegments({ action: 'connect' }, 'path', 'action')).toEqual(['connect']);
  });

  it('reads oauth step segment', () => {
    expect(vercelPathSegments({ step: 'callback' }, 'step')).toEqual(['callback']);
    expect(vercelPathSegments({ step: ['select-page'] }, 'step')).toEqual(['select-page']);
  });

  it('returns empty when no matching keys', () => {
    expect(vercelPathSegments({}, 'path', 'action')).toEqual([]);
  });
});
