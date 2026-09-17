import { describe, expect, it } from 'vitest';
import type { Lead } from '../../types/models';
import {
  applyIntakeEvaluation,
  countUnresolvedIntakeLeads,
  initialIntakeForExternalLead,
  isUnresolvedIntakeLead,
  participatesInIntakeWorkflow,
} from './leadIntake';

const externalLead = (over: Partial<Lead> = {}): Lead => ({
  id: '1',
  businessId: 'b',
  userId: 'u',
  name: 'דנה',
  phone: '050',
  source: 'facebook',
  notes: '',
  status: 'new',
  externalProvider: 'meta',
  externalLeadId: 'ext-1',
  intakeStatus: 'ready_for_review',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

describe('lead intake workflow', () => {
  it('A. external lead with intake status participates', () => {
    const lead = externalLead();
    expect(participatesInIntakeWorkflow(lead)).toBe(true);
    expect(isUnresolvedIntakeLead(lead)).toBe(true);
  });

  it('B/L. opening — legacy null intake not unresolved', () => {
    const legacy = externalLead({ intakeStatus: undefined });
    expect(participatesInIntakeWorkflow(legacy)).toBe(false);
    expect(isUnresolvedIntakeLead(legacy)).toBe(false);
  });

  it('C. needs_information stays unresolved', () => {
    expect(isUnresolvedIntakeLead(externalLead({ intakeStatus: 'needs_information' }))).toBe(true);
  });

  it('D. ready_for_review unresolved until action', () => {
    expect(isUnresolvedIntakeLead(externalLead({ intakeStatus: 'ready_for_review' }))).toBe(true);
    expect(isUnresolvedIntakeLead(externalLead({ intakeStatus: 'approved' }))).toBe(false);
  });

  it('F. rejection resolves attention', () => {
    expect(isUnresolvedIntakeLead(externalLead({ intakeStatus: 'rejected' }))).toBe(false);
  });

  it('G. sales status independent', () => {
    const lead = externalLead({ status: 'proposal_sent', intakeStatus: 'ready_for_review' });
    expect(lead.status).toBe('proposal_sent');
    expect(lead.intakeStatus).toBe('ready_for_review');
  });

  it('I. recompute after data change', () => {
    const sparse = externalLead({
      phone: '',
      email: undefined,
      intakeStatus: 'needs_information',
      formAnswers: [],
    });
    const result = applyIntakeEvaluation(sparse, undefined);
    expect(result.intakeStatus).toBe('needs_information');

    const filled = { ...sparse, phone: '0501234567', serviceInterest: 'צילום', name: 'דנה' };
    const after = applyIntakeEvaluation(filled, undefined);
    expect(after.completenessSnapshot?.readyForReview).toBe(true);
    expect(after.intakeStatus).toBe('ready_for_review');
  });

  it('initial intake for new external lead', () => {
    const base = externalLead({ intakeStatus: undefined });
    const init = initialIntakeForExternalLead(base, 'event');
    expect(['needs_information', 'ready_for_review']).toContain(init.intakeStatus);
    expect(init.completenessSnapshot?.evaluatedAt).toBeTruthy();
  });

  it('F. approved intake record has no activity conversion fields', () => {
    const approved = externalLead({ intakeStatus: 'approved' });
    expect(approved.convertedToEventId).toBeUndefined();
    expect(approved.convertedToProjectId).toBeUndefined();
  });

  it('count unresolved', () => {
    const n = countUnresolvedIntakeLeads([
      externalLead(),
      externalLead({ id: '2', intakeStatus: 'approved' }),
      externalLead({ id: '3', intakeStatus: undefined }),
    ]);
    expect(n).toBe(1);
  });
});
