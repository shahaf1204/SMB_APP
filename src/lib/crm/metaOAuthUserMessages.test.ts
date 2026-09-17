import { describe, expect, it } from 'vitest';
import { mapMetaOAuthErrorToUserMessage, META_CONNECTION_COPY } from './metaOAuthUserMessages';
import { assertUserVisibleTextSafe } from './metaConnectionUx';

describe('mapMetaOAuthErrorToUserMessage', () => {
  const knownCases: Array<[string, RegExp | string]> = [
    ['page_already_connected', 'עסק אחר'],
    ['business_access_denied', 'הרשאה'],
    ['state_expired', 'פג'],
    ['attempt_expired', 'פג'],
    ['page_subscription_failed', 'נסי שוב'],
    ['user_cancelled', 'בוטל'],
  ];

  it.each(knownCases)('maps %s to safe Hebrew', (code, fragment) => {
    const msg = mapMetaOAuthErrorToUserMessage(code);
    if (typeof fragment === 'string') expect(msg).toContain(fragment);
    else expect(msg).toMatch(fragment);
    expect(assertUserVisibleTextSafe(msg)).toBe(true);
  });

  it('G. unknown errors never expose raw server text', () => {
    const raw =
      'Graph API error: (#190) Invalid OAuth 2.0 Access Token EAAFAKE123 pages_payload webhook';
    const msg = mapMetaOAuthErrorToUserMessage(raw);
    expect(msg).not.toContain('Graph');
    expect(msg).not.toContain('EAAFAKE');
    expect(msg).not.toContain('webhook');
    expect(assertUserVisibleTextSafe(msg)).toBe(true);
  });

  it('unknown snake_case codes use generic message', () => {
    expect(mapMetaOAuthErrorToUserMessage('internal_meta_failure_code')).toBe(
      'משהו לא הצליח בחיבור. אפשר לנסות שוב או להתחיל מחדש.',
    );
  });
});

describe('META_CONNECTION_COPY', () => {
  it('uses product language without forbidden terms', () => {
    const blob = Object.values(META_CONNECTION_COPY).join(' ');
    expect(blob).not.toMatch(/oauth|webhook|token|Graph API|Page ID/i);
    expect(blob).toContain('Facebook ו-Instagram');
    expect(META_CONNECTION_COPY.benefit).toMatch(/לידים חדשים/);
  });
});
