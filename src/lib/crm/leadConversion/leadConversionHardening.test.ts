import { describe, expect, it } from 'vitest';
import type { Business, Engagement, Event, Lead } from '../../../types/models';
import { buildFinalizedLeadAfterConversion } from './leadConversionFinalize';
import {
  evaluateConversionCompleteness,
} from './leadConversionCompleteness';
import { buildLeadConversionDraft } from './leadConversionDraft';
import {
  findConversionActivityByLeadId,
  planLeadConversion,
  LEAD_CONVERSION_CREATION_SOURCE,
} from './leadConversionProvenance';
import { resolveConversionRequirements } from './resolveConversionRequirements';

const business = (primary: Business['workspace'] extends infer W ? W : never): Business =>
  ({
    id: 'b1',
    name: 'Test',
    workspace: primary,
  }) as Business;

const intakeLead = (over: Partial<Lead> = {}): Lead => ({
  id: 'l1',
  businessId: 'b1',
  userId: 'u1',
  name: 'דנה',
  phone: '050',
  source: 'facebook',
  notes: '',
  status: 'new',
  externalProvider: 'meta',
  externalLeadId: 'ext-1',
  intakeStatus: 'approved',
  serviceInterest: 'טיפול פנים',
  createdAt: '2026-01-01',
  ...over,
});

const conversionEvent = (over: Partial<Event> = {}): Event => ({
  id: 'ev-orphan',
  businessId: 'b1',
  userId: 'u1',
  title: 'טיפול',
  eventDate: '2026-06-01',
  location: '',
  notes: '',
  sourceLeadId: 'l1',
  creationSource: LEAD_CONVERSION_CREATION_SOURCE,
  conversionTarget: 'appointment',
  ...over,
});

const conversionEngagement = (over: Partial<Engagement> = {}): Engagement => ({
  id: 'eng-1',
  businessId: 'b1',
  userId: 'u1',
  kind: 'session_pack',
  title: 'חבילה',
  clientName: 'דנה',
  status: 'active',
  startDate: '2026-06-01',
  notes: '',
  createdAt: '2026-06-01T10:00:00.000Z',
  sourceLeadId: 'l1',
  creationSource: LEAD_CONVERSION_CREATION_SOURCE,
  conversionTarget: 'package',
  ...over,
});

describe('conversion idempotency provenance', () => {
  it('finds existing Event by sourceLeadId before Lead link exists', () => {
    const found = findConversionActivityByLeadId('l1', [conversionEvent()], []);
    expect(found?.activityId).toBe('ev-orphan');
    expect(found?.effectiveTarget).toBe('appointment');
  });

  it('finds existing Engagement by sourceLeadId', () => {
    const found = findConversionActivityByLeadId('l1', [], [conversionEngagement()]);
    expect(found?.activityId).toBe('eng-1');
    expect(found?.effectiveTarget).toBe('package');
  });

  it('plan prefers reuse over create when orphan activity exists', () => {
    const plan = planLeadConversion('l1', 'event', [conversionEvent()], []);
    expect(plan.mode).toBe('reuse_existing');
    expect(plan.existingActivityId).toBe('ev-orphan');
    expect(plan.effectiveTarget).toBe('appointment');
  });

  it('retry finalization links lead without second activity', () => {
    const lead = intakeLead();
    const finalized = buildFinalizedLeadAfterConversion(lead, 'appointment', 'ev-orphan');
    expect(finalized.intakeStatus).toBe('converted');
    expect(finalized.convertedToEventId).toBe('ev-orphan');
  });

  it('journey engagement uses stored conversionTarget', () => {
    const eng = conversionEngagement({
      id: 'j1',
      kind: 'project',
      conversionTarget: 'journey',
    });
    const found = findConversionActivityByLeadId('l1', [], [eng]);
    expect(found?.effectiveTarget).toBe('journey');
  });
});

describe('conversion requirements resolver', () => {
  const ctx = business({
    primaryOperatingModel: 'appointment',
    enabledOperatingModels: ['appointment'],
    onboardingCompleted: true,
  } as Business['workspace']);

  it('does not block appointment on location by default', () => {
    const reqs = resolveConversionRequirements({
      business: ctx,
      targetModel: 'appointment',
      categories: [],
    });
    const blocking = reqs.filter((r) => r.purpose === 'conversion_blocking').map((r) => r.fieldKey);
    expect(blocking).toContain('client_name');
    expect(blocking).toContain('title');
    expect(blocking).toContain('activity_date');
    expect(blocking).not.toContain('location');
    expect(blocking).not.toContain('activity_time');
  });

  it('appointment ready without location when date filled', () => {
    const draft = buildLeadConversionDraft(intakeLead());
    const filled = { ...draft, activityDate: '2026-06-01' };
    const snap = evaluateConversionCompleteness(filled, 'appointment', {
      business: ctx,
      categories: [],
    });
    expect(snap.readyToConfirm).toBe(true);
  });

  it('engagement targets require start date via fallback', () => {
    const reqs = resolveConversionRequirements({
      business: ctx,
      targetModel: 'project',
      categories: [],
    });
    expect(reqs.some((r) => r.fieldKey === 'start_date' && r.purpose === 'conversion_blocking')).toBe(
      true,
    );
  });
});

describe('conversion flow simulation', () => {
  it('normal path: no existing activity plans create', () => {
    const plan = planLeadConversion('l1', 'event', [], []);
    expect(plan.mode).toBe('create_new');
  });

  it('simulated activity-success + lead-finalize-failure then retry reuses one event', () => {
    const events: Event[] = [conversionEvent()];
    const leads: Lead[] = [intakeLead()];

    const firstPlan = planLeadConversion('l1', 'event', events, []);
    expect(firstPlan.mode).toBe('reuse_existing');

    const retryPlan = planLeadConversion('l1', 'event', events, []);
    expect(retryPlan.mode).toBe('reuse_existing');
    expect(events.filter((e) => e.sourceLeadId === 'l1')).toHaveLength(1);

    leads[0] = buildFinalizedLeadAfterConversion(leads[0], retryPlan.effectiveTarget, 'ev-orphan');
    expect(leads[0].convertedToEventId).toBe('ev-orphan');
  });

  it('double conversion attempt after success uses lead link (eligibility)', () => {
    const finalized = buildFinalizedLeadAfterConversion(intakeLead(), 'event', 'ev-1');
    expect(finalized.intakeStatus).toBe('converted');
    expect(finalized.convertedToEventId).toBe('ev-1');
  });
});
