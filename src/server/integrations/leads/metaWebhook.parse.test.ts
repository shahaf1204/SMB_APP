import { describe, expect, it } from 'vitest';
import { parseMetaLeadgenChanges } from './metaWebhook.parse';

describe('metaWebhook.parse', () => {
  it('6. ignores unrelated change types', () => {
    const changes = parseMetaLeadgenChanges({
      entry: [
        {
          changes: [
            { field: 'feed', value: { leadgen_id: 'ignored' } as never },
            {
              field: 'leadgen',
              value: { leadgen_id: 'L1', page_id: 'P1', form_id: 'F1' },
            },
          ],
        },
      ],
    });
    expect(changes).toHaveLength(1);
    expect(changes[0]?.leadgenId).toBe('L1');
  });

  it('7. parses leadgen identifiers', () => {
    const changes = parseMetaLeadgenChanges({
      entry: [
        {
          time: 1_700_000_000,
          changes: [
            {
              field: 'leadgen',
              value: {
                leadgen_id: 'gen-99',
                page_id: 'page-42',
                form_id: 'form-7',
                created_time: 1_700_000_100,
              },
            },
          ],
        },
      ],
    });
    expect(changes[0]).toMatchObject({
      leadgenId: 'gen-99',
      pageId: 'page-42',
      formId: 'form-7',
    });
    expect(changes[0]?.createdTime).toBeTruthy();
  });
});
