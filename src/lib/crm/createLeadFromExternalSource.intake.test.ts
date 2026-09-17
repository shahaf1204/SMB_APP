import { describe, expect, it } from 'vitest';
import { createLeadFromExternalSource } from './createLeadFromExternalSource';

describe('createLeadFromExternalSource intake', () => {
  it('J. meta-style lead gets intake fields', () => {
    const { lead, created } = createLeadFromExternalSource(
      {
        businessId: 'b',
        userId: 'u',
        fullName: 'דנה',
        phone: '050',
        source: 'facebook',
        externalProvider: 'meta',
        externalLeadId: 'lg-1',
      },
      [],
    );
    expect(created).toBe(true);
    expect(lead.intakeStatus).toBeDefined();
    expect(lead.completenessSnapshot).toBeDefined();
    expect(lead.status).toBe('new');
  });

  it('P. duplicate does not re-init intake', () => {
    const existing = createLeadFromExternalSource(
      {
        businessId: 'b',
        userId: 'u',
        fullName: 'דנה',
        phone: '050',
        source: 'facebook',
        externalProvider: 'meta',
        externalLeadId: 'lg-1',
      },
      [],
    ).lead;
    const dup = createLeadFromExternalSource(
      {
        businessId: 'b',
        userId: 'u',
        fullName: 'דנה',
        phone: '050',
        source: 'facebook',
        externalProvider: 'meta',
        externalLeadId: 'lg-1',
      },
      [existing],
    );
    expect(dup.created).toBe(false);
    expect(dup.lead.intakeStatus).toBe(existing.intakeStatus);
  });
});
