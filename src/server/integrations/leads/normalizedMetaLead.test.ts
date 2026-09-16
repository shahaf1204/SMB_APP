import { describe, expect, it } from 'vitest';
import {
  normalizeMetaLeadFromGraph,
  resolveMetaLeadSourceChannel,
} from './normalizedMetaLead';
import type { MetaLeadData } from './metaLead.service';

describe('normalizedMetaLead', () => {
  it('21. preserves campaign/ad/form attribution', () => {
    const graph: MetaLeadData = {
      id: 'lead-1',
      campaign_id: 'c1',
      campaign_name: 'Summer',
      ad_id: 'a1',
      ad_name: 'Ad A',
      form_id: 'f1',
      field_data: [{ name: 'full_name', values: ['Test'] }],
    };

    const normalized = normalizeMetaLeadFromGraph(graph, {
      leadgenId: 'lead-1',
      pageId: 'page-1',
      pageName: 'Page',
      receivedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(normalized.externalCampaignId).toBe('c1');
    expect(normalized.externalAdId).toBe('a1');
    expect(normalized.externalFormId).toBe('f1');
  });

  it('22. missing optional fields handled', () => {
    const graph: MetaLeadData = { id: 'lead-2', field_data: [] };
    const normalized = normalizeMetaLeadFromGraph(graph, {
      leadgenId: 'lead-2',
      pageId: 'p',
      receivedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(normalized.fullName).toBe('ללא שם');
    expect(normalized.phone).toBe('');
  });

  it('instagram only with explicit platform', () => {
    const graph = { id: 'x', platform: 'instagram' } as MetaLeadData;
    expect(resolveMetaLeadSourceChannel(graph)).toBe('instagram');
  });

  it('does not guess instagram without evidence', () => {
    const graph: MetaLeadData = { id: 'x' };
    expect(resolveMetaLeadSourceChannel(graph)).toBe('facebook');
  });
});
