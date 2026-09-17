import { describe, expect, it } from 'vitest';
import { buildInitialIntakeDbFields } from './leadIntakePersist.server';

describe('buildInitialIntakeDbFields', () => {
  it('persists intake_status and snapshot for new external rows', () => {
    const fields = buildInitialIntakeDbFields(
      {
        name: 'דנה',
        phone: '0501234567',
        email: 'a@b.com',
        formAnswers: [],
        notes: '',
      },
      'appointment',
    );
    expect(fields.intake_status).toMatch(/needs_information|ready_for_review/);
    expect(fields.completeness_snapshot?.requirements.length).toBeGreaterThan(0);
    expect(fields.intake_status_history?.[0]?.status).toBe(fields.intake_status);
  });
});
