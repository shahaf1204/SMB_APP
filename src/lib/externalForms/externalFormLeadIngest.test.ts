import { describe, expect, it } from 'vitest';
import type { ExternalFormConnection, NormalizedFormPayload } from '../../types/externalForms';
import type { Lead } from '../../types/models';
import { buildLeadPayloadFromExternalForm } from './externalFormLeadAdapter';
import {
  ingestExternalFormLead,
  validateLeadIngestPayload,
} from './ingestExternalFormSubmission';
import { isUnresolvedIntakeLead } from '../crm/leadIntake';
import { isLeadConversionEligible } from '../crm/leadConversion/leadConversionEligibility';
import { createLeadFromExternalSource } from '../crm/createLeadFromExternalSource';
import { evaluateLeadCompleteness } from '../crm/leadCompleteness';
import { resolveFormsWebhookConnectionId } from '../../server/integrations/externalForms/externalForms.service';

const connection = (): ExternalFormConnection => ({
  id: 'conn-1',
  businessId: 'b1',
  ownerId: 'u1',
  provider: 'google_forms',
  formName: 'טופס הרשמה',
  webhookUrl: 'https://example.com/hook',
  secretKey: 'secret',
  activityType: 'event',
  submissionMode: 'lead_first',
  isActive: true,
  fieldMapping: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  submissionCount: 0,
});

const normalized = (over: Partial<NormalizedFormPayload['fields']> = {}): NormalizedFormPayload => ({
  externalSubmissionId: 'sub-99',
  fields: {
    clientName: 'ילד',
    clientPhone: '0501234567',
    clientEmail: 'a@b.com',
    activityTitle: 'חוג',
    activityDate: '2026-07-01',
    activityTime: '18:00',
    location: 'תל אביב',
    notes: 'הערה',
    ...over,
  },
  unmapped: { 'שדה נוסף': 'ערך' },
  sourceProvider: 'google_forms',
});

describe('external form lead-first ingest (3A.6.1)', () => {
  it('A/F. ingest creates Lead with intake, not Event', () => {
    const { lead, created } = ingestExternalFormLead({
      connection: connection(),
      normalized: normalized(),
      submissionId: 'local-sub-1',
      businessId: 'b1',
      userId: 'u1',
      existingLeads: [],
      primaryOperatingModel: 'event',
    });
    expect(created).toBe(true);
    expect(lead.intakeStatus).toBeDefined();
    expect(lead.externalLeadId).toBe('sub-99');
    expect(lead.externalFormId).toBe('conn-1');
  });

  it('B. Lead gets explicit intake status', () => {
    const { lead } = ingestExternalFormLead({
      connection: connection(),
      normalized: normalized(),
      submissionId: 's1',
      businessId: 'b1',
      userId: 'u1',
      existingLeads: [],
    });
    expect(['needs_information', 'ready_for_review']).toContain(lead.intakeStatus);
    expect(lead.completenessSnapshot).toBeDefined();
  });

  it('C. complete form → ready_for_review', () => {
    const { lead } = ingestExternalFormLead({
      connection: connection(),
      normalized: normalized(),
      submissionId: 's1',
      businessId: 'b1',
      userId: 'u1',
      existingLeads: [],
      primaryOperatingModel: 'event',
    });
    expect(lead.intakeStatus).toBe('ready_for_review');
    expect(lead.completenessSnapshot?.readyForReview).toBe(true);
  });

  it('D. incomplete form → needs_information', () => {
    const { lead } = ingestExternalFormLead({
      connection: connection(),
      normalized: normalized({ clientPhone: '', clientEmail: '', clientName: 'בדיקה' }),
      submissionId: 's2',
      businessId: 'b1',
      userId: 'u1',
      existingLeads: [],
    });
    expect(lead.intakeStatus).toBe('needs_information');
  });

  it('E. form Lead is unresolved intake', () => {
    const { lead } = ingestExternalFormLead({
      connection: connection(),
      normalized: normalized(),
      submissionId: 's1',
      businessId: 'b1',
      userId: 'u1',
      existingLeads: [],
    });
    expect(isUnresolvedIntakeLead(lead)).toBe(true);
  });

  it('G. duplicate submission does not create duplicate Lead', () => {
    const first = ingestExternalFormLead({
      connection: connection(),
      normalized: normalized(),
      submissionId: 's1',
      businessId: 'b1',
      userId: 'u1',
      existingLeads: [],
    });
    const second = ingestExternalFormLead({
      connection: connection(),
      normalized: normalized(),
      submissionId: 's1',
      businessId: 'b1',
      userId: 'u1',
      existingLeads: [first.lead],
    });
    expect(second.created).toBe(false);
    expect(second.lead.id).toBe(first.lead.id);
  });

  it('H/I. duplicate does not reset approved intake', () => {
    const approved: Lead = {
      ...ingestExternalFormLead({
        connection: connection(),
        normalized: normalized(),
        submissionId: 's1',
        businessId: 'b1',
        userId: 'u1',
        existingLeads: [],
      }).lead,
      intakeStatus: 'approved',
    };
    const retry = createLeadFromExternalSource(
      buildLeadPayloadFromExternalForm({
        connection: connection(),
        normalized: normalized(),
        businessId: 'b1',
        userId: 'u1',
        submissionId: 's1',
        externalSubmissionId: 'sub-99',
      }),
      [approved],
    );
    expect(retry.created).toBe(false);
    expect(retry.lead.intakeStatus).toBe('approved');
  });

  it('J/K. normalized mapping preserves contact, schedule, answers', () => {
    const payload = buildLeadPayloadFromExternalForm({
      connection: connection(),
      normalized: normalized(),
      businessId: 'b1',
      userId: 'u1',
      submissionId: 's1',
    });
    expect(payload.fullName).toBe('ילד');
    expect(payload.phone).toBe('0501234567');
    expect(payload.formAnswers?.some((a) => a.field.includes('תאריך'))).toBe(true);
    expect(payload.formAnswers?.some((a) => a.field === 'שדה נוסף')).toBe(true);
    const snap = evaluateLeadCompleteness(
      {
        name: payload.fullName,
        phone: payload.phone,
        email: payload.email,
        serviceInterest: payload.serviceInterest,
        formAnswers: payload.formAnswers,
        notes: payload.notes,
      },
      { primaryOperatingModel: 'event' },
    );
    expect(snap.missingConversionFieldKeys.length).toBe(0);
  });

  it('L. form answers available on Lead for completeness', () => {
    const { lead } = ingestExternalFormLead({
      connection: connection(),
      normalized: normalized(),
      submissionId: 's1',
      businessId: 'b1',
      userId: 'u1',
      existingLeads: [],
      primaryOperatingModel: 'event',
    });
    expect(lead.formAnswers?.length).toBeGreaterThan(0);
    expect(lead.completenessSnapshot?.missingReviewFieldKeys).toEqual([]);
  });

  it('M. approved form Lead can enter Phase 3A.6 conversion', () => {
    const { lead } = ingestExternalFormLead({
      connection: connection(),
      normalized: normalized(),
      submissionId: 's1',
      businessId: 'b1',
      userId: 'u1',
      existingLeads: [],
    });
    const approved = { ...lead, intakeStatus: 'approved' as const };
    expect(isLeadConversionEligible(approved)).toBe(true);
  });

  it('P. sales status stays independent (new)', () => {
    const { lead } = ingestExternalFormLead({
      connection: connection(),
      normalized: normalized(),
      submissionId: 's1',
      businessId: 'b1',
      userId: 'u1',
      existingLeads: [],
    });
    expect(lead.status).toBe('new');
  });

  it('Q. payload JSON does not expose secrets', () => {
    const payload = buildLeadPayloadFromExternalForm({
      connection: connection(),
      normalized: normalized(),
      businessId: 'b1',
      userId: 'u1',
      submissionId: 's1',
    });
    expect(JSON.stringify(payload)).not.toMatch(/secret|access_token/i);
  });

  it('R. google_forms provider maps to google source channel', () => {
    const payload = buildLeadPayloadFromExternalForm({
      connection: connection(),
      normalized: normalized(),
      businessId: 'b1',
      userId: 'u1',
      submissionId: 's1',
    });
    expect(payload.source).toBe('google');
  });

  it('N. public webhook connection id contract unchanged', () => {
    expect(
      resolveFormsWebhookConnectionId({
        method: 'POST',
        body: {},
        query: { connectionId: 'conn-public-1' },
        headers: {},
      }),
    ).toBe('conn-public-1');
  });

  it('validates minimum identity', () => {
    expect(validateLeadIngestPayload(normalized()).valid).toBe(true);
    expect(
      validateLeadIngestPayload({
        fields: {},
        unmapped: {},
        sourceProvider: 'forms_app',
      }).valid,
    ).toBe(false);
  });
});
