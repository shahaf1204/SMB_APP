import { describe, expect, it } from 'vitest';
import type { Lead } from '../../types/models';
import { evaluateLeadCompleteness } from './leadCompleteness';

function lead(partial: Partial<Lead>): Lead {
  return {
    id: '1',
    businessId: 'b',
    userId: 'u',
    name: 'Test',
    source: 'facebook',
    notes: '',
    status: 'new',
    createdAt: '2026-01-01',
    ...partial,
  };
}

describe('evaluateLeadCompleteness', () => {
  it('H. structured snapshot', () => {
    const snap = evaluateLeadCompleteness(
      lead({ name: 'דנה', phone: '050', formAnswers: [{ field: 'שירות', value: 'צילום' }] }),
      {},
    );
    expect(snap.requirements.length).toBeGreaterThan(0);
    expect(Array.isArray(snap.missingFieldKeys)).toBe(true);
    expect(typeof snap.readyForReview).toBe('boolean');
    expect(snap.evaluatedAt).toMatch(/^\d{4}-/);
  });

  it('event model adds conversion-blocking schedule gaps without blocking review', () => {
    const snap = evaluateLeadCompleteness(
      lead({ name: 'דנה', phone: '050', serviceInterest: 'אירוע' }),
      { primaryOperatingModel: 'event' },
    );
    expect(snap.missingConversionFieldKeys).toContain('activity_date');
    expect(snap.readyForReview).toBe(true);
  });
});
