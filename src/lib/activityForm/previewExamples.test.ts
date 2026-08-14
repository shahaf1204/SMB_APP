import { describe, expect, it } from 'vitest';
import { resolvePreviewExample, PREVIEW_SAMPLE_DATE } from './previewExamples';
import type { ActivityFormFieldPresentation } from './types';

function field(partial: Partial<ActivityFormFieldPresentation>): ActivityFormFieldPresentation {
  return {
    key: 'test',
    label: 'Test',
    valueType: 'text',
    metricRole: 'neutral',
    required: false,
    locked: false,
    source: 'system',
    priority: 'primary',
    section: 'business_details',
    order: 0,
    visibleByDefault: true,
    ...partial,
  };
}

describe('resolvePreviewExample', () => {
  it('returns realistic title example', () => {
    expect(
      resolvePreviewExample(field({ key: '__builtin_title', builtin: 'title', label: 'שם הפעילות' })),
    ).toBe('יום הולדת מאיה');
  });

  it('returns client name example', () => {
    expect(
      resolvePreviewExample(field({ key: 'client_name', label: 'שם לקוח', section: 'client' })),
    ).toBe('דנה כהן');
  });

  it('returns formatted date example', () => {
    expect(
      resolvePreviewExample(field({ key: '__builtin_date', builtin: 'date', valueType: 'date', label: 'תאריך' })),
    ).toBe(PREVIEW_SAMPLE_DATE);
  });

  it('returns time example for start time', () => {
    expect(
      resolvePreviewExample(
        field({ key: 'event_start_time', valueType: 'duration', label: 'שעת התחלה' }),
      ),
    ).toBe('16:00');
  });

  it('returns location example', () => {
    expect(
      resolvePreviewExample(field({ key: 'event_location', label: 'מיקום' })),
    ).toBe('גן האירועים רמת אביב');
  });

  it('returns currency example for revenue fields', () => {
    expect(
      resolvePreviewExample(
        field({ key: 'total_amount', valueType: 'number', metricRole: 'revenue', label: 'סכום כולל' }),
      ),
    ).toBe('₪3,500');
  });

  it('returns participants count', () => {
    expect(
      resolvePreviewExample(
        field({ key: 'participants_count', valueType: 'number', label: 'מספר משתתפים' }),
      ),
    ).toBe('20');
  });

  it('returns event type example', () => {
    expect(
      resolvePreviewExample(field({ key: 'event_type', label: 'סוג אירוע' })),
    ).toBe('יום הולדת');
  });

  it('uses photographer business override for title', () => {
    expect(
      resolvePreviewExample(
        field({ key: '__builtin_title', builtin: 'title', label: 'שם הפעילות' }),
        { businessType: 'photographer', operatingModel: 'event' },
      ),
    ).toBe('צילום משפחה');
  });
});
