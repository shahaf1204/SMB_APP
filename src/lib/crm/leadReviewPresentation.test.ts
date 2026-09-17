import { describe, expect, it } from 'vitest';
import type { Lead } from '../../types/models';
import {
  assertReviewPresentationSafe,
  buildLeadRequestSummary,
  formatFormAnswerForDisplay,
} from './leadReviewPresentation';

describe('leadReviewPresentation', () => {
  it('N. hides raw provider payload patterns', () => {
    expect(formatFormAnswerForDisplay('field_data', '{"access_token":"x"}')).toBeNull();
    expect(assertReviewPresentationSafe('{"leadgen_id":123}')).toBe(false);
    expect(assertReviewPresentationSafe('שם: דנה')).toBe(true);
  });

  it('builds user-facing request rows', () => {
    const rows = buildLeadRequestSummary({
      id: '1',
      businessId: 'b',
      userId: 'u',
      name: 'דנה',
      source: 'facebook',
      notes: '',
      status: 'new',
      createdAt: '2026-01-01',
      serviceInterest: 'צילום',
      formAnswers: [{ field: 'טלפון', value: '050' }],
    } as Lead);
    expect(rows.some((r) => r.label === 'בקשה')).toBe(true);
    expect(rows.join(' ')).not.toMatch(/oauth/i);
  });
});
