import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExternalFormConnection } from '../../types/externalForms';
import { ingestExternalFormLead } from './ingestExternalFormSubmission';
import {
  connectionSubmissionMode,
  DEFAULT_EXTERNAL_FORM_SUBMISSION_MODE,
  isLeadFirstExternalForm,
  isLegacyAutoEventExternalForm,
  LEGACY_AUTO_EVENT_MODE,
} from './submissionMode';

const baseConnection = (over: Partial<ExternalFormConnection> = {}): ExternalFormConnection =>
  ({
    id: 'c1',
    businessId: 'b',
    ownerId: 'u',
    provider: 'forms_app',
    formName: 'טופס',
    webhookUrl: 'https://example.com/h',
    secretKey: 's',
    activityType: 'event',
    isActive: true,
    fieldMapping: [],
    createdAt: '',
    updatedAt: '',
    submissionCount: 0,
    ...over,
  }) as ExternalFormConnection;

describe('submissionMode resolution (3A.6.1 hardening)', () => {
  it('A. new connection with lead_first stays lead_first', () => {
    expect(connectionSubmissionMode(baseConnection({ submissionMode: 'lead_first' }))).toBe(
      'lead_first',
    );
    expect(DEFAULT_EXTERNAL_FORM_SUBMISSION_MODE).toBe('lead_first');
  });

  it('B. missing submissionMode → lead_first', () => {
    expect(connectionSubmissionMode(baseConnection())).toBe('lead_first');
    expect(isLeadFirstExternalForm(baseConnection())).toBe(true);
  });

  it('C. invalid/unknown mode → lead_first', () => {
    expect(
      connectionSubmissionMode(
        baseConnection({ submissionMode: 'unknown' as ExternalFormConnection['submissionMode'] }),
      ),
    ).toBe('lead_first');
    expect(
      connectionSubmissionMode(
        baseConnection({ submissionMode: undefined }),
      ),
    ).toBe('lead_first');
  });

  it('D. explicit persisted auto_event → auto_event', () => {
    const legacy = baseConnection({ submissionMode: LEGACY_AUTO_EVENT_MODE });
    expect(connectionSubmissionMode(legacy)).toBe('auto_event');
    expect(isLegacyAutoEventExternalForm(legacy)).toBe(true);
    expect(isLeadFirstExternalForm(legacy)).toBe(false);
  });

  it('F. lead_first path uses ingest (Lead, not Event)', () => {
    const conn = baseConnection({ submissionMode: 'lead_first', provider: 'google_forms' });
    expect(isLeadFirstExternalForm(conn)).toBe(true);
    const { lead, created } = ingestExternalFormLead({
      connection: conn,
      normalized: {
        fields: { clientName: 'א', clientPhone: '050', activityTitle: 'חוג' },
        unmapped: {},
        sourceProvider: 'google_forms',
      },
      submissionId: 'sub-1',
      businessId: 'b',
      userId: 'u',
      existingLeads: [],
    });
    expect(created).toBe(true);
    expect(lead.intakeStatus).toBeDefined();
    expect(lead.externalFormId).toBe('c1');
  });

  it('G. Google Forms without submissionMode → lead_first', () => {
    expect(isLeadFirstExternalForm(baseConnection({ provider: 'google_forms' }))).toBe(true);
  });
});

describe('submissionMode UI exposure', () => {
  const uiRoots = [
    join(process.cwd(), 'src/pages'),
    join(process.cwd(), 'src/components'),
  ];

  function collectTsxFiles(dir: string): string[] {
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        out.push(...collectTsxFiles(full));
      } else if (name.endsWith('.tsx')) {
        out.push(full);
      }
    }
    return out;
  }

  it('E. no user-facing UI offers auto_event choice', () => {
    const forbidden = ['auto_event', 'auto-event', 'auto event'];
    for (const root of uiRoots) {
      for (const file of collectTsxFiles(root)) {
        const text = readFileSync(file, 'utf8');
        for (const token of forbidden) {
          expect(text, `${file} must not expose ${token}`).not.toContain(token);
        }
      }
    }
  });
});
