import { describe, expect, it } from 'vitest';
import {
  applyDefaultEnabledToDrafts,
  buildOnboardingPreviewRows,
  partitionDraftsForOnboarding,
  resolveActivityFormSchemaFromDrafts,
} from './resolveActivityFormSchema';
import { templatesToOnboardingDrafts } from '../categories/resolveRecommendedCategories';
import { resolveRecommendedCategories } from '../categories/resolveRecommendedCategories';

describe('resolveActivityFormSchema', () => {
  const photographerEventDrafts = templatesToOnboardingDrafts(
    resolveRecommendedCategories({
      presetId: 'photographer',
      businessType: 'photographer',
      primaryOperatingModel: 'event',
      enabledOperatingModels: ['event'],
    }),
  );

  it('photographer + event: core fields locked, financial in payment section', () => {
    const schema = resolveActivityFormSchemaFromDrafts({
      drafts: photographerEventDrafts,
      businessType: 'photographer',
      operatingModel: 'event',
    });

    const financial = schema.sections.find((s) => s.id === 'financial');
    expect(financial).toBeTruthy();
    expect(financial!.fields.some((f) => f.metricRole === 'revenue')).toBe(true);
    expect(financial!.fields.every((f) => f.section === 'financial')).toBe(true);

    const advanced = schema.sections.find((s) => s.id === 'advanced');
    expect(advanced?.fields.some((f) => f.key === 'customer_source')).toBe(true);
  });

  it('customer_source is not in financial section', () => {
    const schema = resolveActivityFormSchemaFromDrafts({
      drafts: photographerEventDrafts,
      businessType: 'photographer',
      operatingModel: 'event',
    });
    const financial = schema.sections.find((s) => s.id === 'financial');
    expect(financial!.fields.some((f) => f.key === 'customer_source')).toBe(false);
  });

  it('advanced fields disabled by default in fresh drafts', () => {
    const drafts = applyDefaultEnabledToDrafts(photographerEventDrafts);
    expect(drafts.find((d) => d.key === 'preparation_status')?.enabled).toBe(false);
    expect(drafts.find((d) => d.key === 'total_amount')?.enabled).toBe(true);
  });

  it('partition separates recommended from more fields', () => {
    const partition = partitionDraftsForOnboarding(photographerEventDrafts, {
      businessType: 'photographer',
      operatingModel: 'event',
    });
    expect(partition.coreSummaryLabels).toContain('שם הפעילות');
    expect(partition.recommended.some((d) => d.key === 'total_amount')).toBe(true);
    expect(partition.more.some((d) => d.key === 'preparation_status')).toBe(true);
  });

  it('preview returns realistic examples', () => {
    const schema = resolveActivityFormSchemaFromDrafts({
      drafts: photographerEventDrafts,
      businessType: 'photographer',
      operatingModel: 'event',
    });
    const rows = buildOnboardingPreviewRows(schema, {
      businessType: 'photographer',
      operatingModel: 'event',
    });
    expect(rows.length).toBeLessThanOrEqual(5);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows.some((r) => r.example.includes('₪'))).toBe(true);
    expect(rows.some((r) => r.example === 'דנה כהן' || r.label.includes('לקוח'))).toBe(true);
  });

  it('journey business resolves without error', () => {
    const drafts = templatesToOnboardingDrafts(
      resolveRecommendedCategories({
        presetId: 'coach',
        primaryOperatingModel: 'journey',
        enabledOperatingModels: ['journey'],
      }),
    );
    const schema = resolveActivityFormSchemaFromDrafts({
      drafts,
      businessType: 'coach',
      operatingModel: 'journey',
    });
    expect(schema.sections.length).toBeGreaterThan(0);
  });
});
