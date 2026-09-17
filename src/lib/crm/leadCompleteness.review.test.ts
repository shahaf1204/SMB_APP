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

describe('review vs conversion completeness (3A.5.1)', () => {
  it('A. beauty inquiry — name + contact + request without schedule is reviewable', () => {
    const snap = evaluateLeadCompleteness(
      lead({
        name: 'מיה',
        phone: '0501111111',
        serviceInterest: 'טיפול פנים',
      }),
      { primaryOperatingModel: 'appointment' },
    );
    expect(snap.readyForReview).toBe(true);
    expect(snap.missingConversionFieldKeys).toContain('activity_date');
    expect(snap.missingReviewFieldKeys).toHaveLength(0);
  });

  it('B. appointment inquiry before scheduled time', () => {
    const snap = evaluateLeadCompleteness(
      lead({
        name: 'הורה',
        phone: '0502222222',
        formAnswers: [{ field: 'סוג שירות', value: 'יום הולדת' }],
      }),
      { primaryOperatingModel: 'appointment' },
    );
    expect(snap.readyForReview).toBe(true);
    expect(snap.missingConversionFieldKeys.length).toBeGreaterThan(0);
  });

  it('C. missing activity details remain structured', () => {
    const snap = evaluateLeadCompleteness(
      lead({ name: 'דנה', phone: '050', serviceInterest: 'צילום' }),
      { primaryOperatingModel: 'event' },
    );
    expect(snap.missingConversionFieldKeys).toEqual(
      expect.arrayContaining(['activity_date', 'activity_time', 'location']),
    );
    expect(snap.requirements.some((r) => r.purpose === 'conversion_blocking')).toBe(true);
  });

  it('D. review and conversion layers are distinct', () => {
    const snap = evaluateLeadCompleteness(
      lead({ name: 'דנה', phone: '050', serviceInterest: 'אירוע' }),
      { primaryOperatingModel: 'event' },
    );
    expect(snap.readyForReview).toBe(true);
    expect(snap.missingConversionFieldKeys.length).toBe(3);
  });

  it('E. no contact route stays needs_information', () => {
    const snap = evaluateLeadCompleteness(
      lead({ name: 'דנה', phone: '', email: undefined, serviceInterest: 'טיפול' }),
      {},
    );
    expect(snap.readyForReview).toBe(false);
    expect(snap.missingReviewFieldKeys).toContain('contact_method');
  });

  it('birthday — approximate date without final time/location is reviewable', () => {
    const snap = evaluateLeadCompleteness(
      lead({
        name: 'הורה',
        phone: '0503333333',
        formAnswers: [
          { field: 'שירות', value: 'יום הולדת' },
          { field: 'תאריך האירוע', value: '2026-08-01' },
        ],
      }),
      { primaryOperatingModel: 'event' },
    );
    expect(snap.readyForReview).toBe(true);
    expect(snap.missingConversionFieldKeys).toContain('activity_time');
    expect(snap.missingConversionFieldKeys).toContain('location');
  });
});
