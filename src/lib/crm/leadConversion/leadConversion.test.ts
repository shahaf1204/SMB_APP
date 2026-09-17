import { describe, expect, it } from 'vitest';
import type { Business, Lead } from '../../../types/models';
import { buildLeadConversionDraft } from './leadConversionDraft';
import { evaluateConversionCompleteness } from './leadConversionCompleteness';
import {
  isLeadAlreadyConverted,
  isLeadConversionEligible,
} from './leadConversionEligibility';
import { resolveLeadConversionTarget } from './leadConversionTarget';
import { resolveLeadActivityHref } from './leadConversionHref';
import { isUnresolvedIntakeLead } from '../leadIntake';
import { buildLeadPayloadFromExternalForm } from '../../externalForms/externalFormLeadAdapter';

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

describe('lead conversion eligibility', () => {
  it('A. non-approved cannot convert', () => {
    expect(isLeadConversionEligible(intakeLead({ intakeStatus: 'ready_for_review' }))).toBe(false);
  });

  it('B. approved can convert', () => {
    expect(isLeadConversionEligible(intakeLead())).toBe(true);
  });

  it('C. already converted cannot duplicate', () => {
    expect(isLeadAlreadyConverted(intakeLead({ convertedToEventId: 'e1', intakeStatus: 'converted' }))).toBe(
      true,
    );
    expect(isLeadConversionEligible(intakeLead({ convertedToEventId: 'e1' }))).toBe(false);
  });

  it('Q. legacy without intake not eligible', () => {
    expect(isLeadConversionEligible(intakeLead({ intakeStatus: undefined }))).toBe(false);
  });
});

describe('target resolution', () => {
  it('D. event primary recommends event', () => {
    const res = resolveLeadConversionTarget(
      intakeLead({ serviceInterest: 'יום הולדת' }),
      business({
        primaryOperatingModel: 'event',
        enabledOperatingModels: ['event'],
        onboardingCompleted: true,
      } as Business['workspace']),
    );
    expect(res.recommendedTarget).toBe('event');
    expect(res.requiresOwnerChoice).toBe(false);
  });

  it('E. appointment primary recommends appointment', () => {
    const res = resolveLeadConversionTarget(
      intakeLead(),
      business({
        primaryOperatingModel: 'appointment',
        enabledOperatingModels: ['appointment'],
        onboardingCompleted: true,
      } as Business['workspace']),
    );
    expect(res.recommendedTarget).toBe('appointment');
  });

  it('F. event + project ambiguous without project signals', () => {
    const res = resolveLeadConversionTarget(
      intakeLead({ serviceInterest: 'פנייה כללית' }),
      business({
        primaryOperatingModel: 'event',
        enabledOperatingModels: ['event', 'project'],
        onboardingCompleted: true,
      } as Business['workspace']),
    );
    expect(res.availableTargets).toContain('event');
    expect(res.availableTargets).toContain('project');
    expect(res.requiresOwnerChoice).toBe(true);
  });

  it('G. appointment + package does not assume package without signals', () => {
    const res = resolveLeadConversionTarget(
      intakeLead({ serviceInterest: 'שיעור ניסיון' }),
      business({
        primaryOperatingModel: 'appointment',
        enabledOperatingModels: ['appointment', 'package'],
        onboardingCompleted: true,
      } as Business['workspace']),
    );
    expect(res.recommendedTarget).not.toBe('package');
  });
});

describe('conversion completeness & prefill', () => {
  it('H/I. missing conversion fields surfaced; prefill from lead', () => {
    const draft = buildLeadConversionDraft(intakeLead());
    expect(draft.clientName).toBe('דנה');
    const snap = evaluateConversionCompleteness(draft, 'event', {
      business: business({
        primaryOperatingModel: 'event',
        enabledOperatingModels: ['event'],
        onboardingCompleted: true,
      } as Business['workspace']),
      categories: [],
    });
    expect(snap.missingFieldKeys.length).toBeGreaterThan(0);
  });

  it('A beauty inquiry can confirm event after owner fills schedule', () => {
    const draft = buildLeadConversionDraft(intakeLead({ serviceInterest: 'טיפול פנים' }));
    const filled = {
      ...draft,
      activityDate: '2026-06-01',
      activityTime: '10:00',
    };
    expect(
      evaluateConversionCompleteness(filled, 'appointment', {
        business: business({
          primaryOperatingModel: 'appointment',
          enabledOperatingModels: ['appointment'],
          onboardingCompleted: true,
        } as Business['workspace']),
        categories: [],
      }).readyToConfirm,
    ).toBe(true);
  });

  it('M. converted lead not unresolved attention', () => {
    expect(isUnresolvedIntakeLead(intakeLead({ intakeStatus: 'converted' }))).toBe(false);
  });

  it('N. href resolves for event link', () => {
    expect(resolveLeadActivityHref(intakeLead({ convertedToEventId: 'ev-1' }))).toBe(
      '/events/ev-1/edit',
    );
  });
});

describe('external form adapter (3A.6 foundation)', () => {
  it('R. builds lead payload without raw payload in UI fields', () => {
    const payload = buildLeadPayloadFromExternalForm({
      businessId: 'b',
      userId: 'u',
      externalSubmissionId: 'sub-1',
      connection: {
        id: 'c1',
        businessId: 'b',
        formName: 'טופס הרשמה',
        provider: 'google_forms',
        submissionCount: 0,
        createdAt: '',
        updatedAt: '',
      },
      normalized: {
        fields: { clientName: 'ילד', clientPhone: '050', activityTitle: 'חוג' },
        unmapped: {},
      },
    });
    expect(payload.fullName).toBe('ילד');
    expect(JSON.stringify(payload)).not.toMatch(/access_token/i);
  });
});
