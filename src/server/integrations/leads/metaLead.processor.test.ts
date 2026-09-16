import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { encryptIntegrationSecret } from '../../core/integrationSecrets.server';
import {
  EXTERNAL_EVENT_STALE_PROCESSING_MS,
  getExternalEventById,
  resetExternalEventMemoryStoreForTests,
  setExternalEventProcessingClaimedAtForTests,
} from '../externalEvents';
import { processMetaLeadgenChange } from './metaLead.processor';
import * as metaConnectionTimestamps from './metaConnectionTimestamps.server';
import * as metaLeadService from './metaLead.service';

vi.mock('../../core/supabase.server', () => ({
  getSupabaseAdminOptional: vi.fn(() => null),
  getSupabaseAdmin: vi.fn(),
  getMetaGraphVersion: vi.fn(() => 'v21.0'),
  getMetaAppSecret: vi.fn(),
  getMetaVerifyToken: vi.fn(),
}));

describe('metaLead.processor', () => {
  const change = {
    leadgenId: 'leadgen-abc',
    pageId: 'page-99',
    formId: 'form-1',
    rawChange: { field: 'leadgen' },
  };

  beforeEach(() => {
    resetExternalEventMemoryStoreForTests();
    vi.restoreAllMocks();
    process.env.INTEGRATION_ENCRYPTION_KEY = 'processor-test-key';
  });

  afterEach(() => {
    resetExternalEventMemoryStoreForTests();
    vi.unstubAllGlobals();
  });

  it('8. first delivery creates ExternalEvent and processes', async () => {
    vi.spyOn(metaLeadService, 'findMetaConnectionByPageId').mockResolvedValue({
      id: 'conn-1',
      business_id: 'biz-1',
      user_id: 'user-1',
      page_name: 'My Page',
      access_token_encrypted: Buffer.from('legacy-token', 'utf8').toString('base64'),
    } as never);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          id: 'leadgen-abc',
          field_data: [{ name: 'full_name', values: ['Alice'] }],
          campaign_id: 'c1',
        }),
      })),
    );

    vi.spyOn(metaLeadService, 'createLeadFromExternalSourceDb').mockResolvedValue({
      id: 'crm-lead-1',
      created: true,
    });

    const result = await processMetaLeadgenChange(change, new Date().toISOString());
    expect(result.kind).toBe('success');
    expect(result.leadId).toBe('crm-lead-1');

    const event = await getExternalEventById(result.externalEventId!);
    expect(event?.processingStatus).toBe('processed');
  });

  it('12/13. v1 encrypted token decrypt works in processor path', async () => {
    vi.spyOn(metaLeadService, 'findMetaConnectionByPageId').mockResolvedValue({
      id: 'conn-1',
      business_id: 'biz-1',
      user_id: 'user-1',
      page_name: 'Page',
      access_token_encrypted: encryptIntegrationSecret('v1-meta-token'),
    } as never);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ id: 'leadgen-abc', field_data: [] }),
      })),
    );

    vi.spyOn(metaLeadService, 'createLeadFromExternalSourceDb').mockResolvedValue({
      id: 'lead-v1',
      created: true,
    });

    const result = await processMetaLeadgenChange(change, new Date().toISOString());
    expect(result.kind).toBe('success');
  });

  it('9. already processed skip does not call Graph', async () => {
    vi.spyOn(metaLeadService, 'findMetaConnectionByPageId').mockResolvedValue({
      id: 'conn-1',
      business_id: 'biz-1',
      user_id: 'user-1',
      page_name: 'Page',
      access_token_encrypted: Buffer.from('t', 'utf8').toString('base64'),
    } as never);

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'leadgen-abc', field_data: [] }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    vi.spyOn(metaLeadService, 'createLeadFromExternalSourceDb').mockResolvedValue({
      id: 'lead-1',
      created: true,
    });

    await processMetaLeadgenChange(change, new Date().toISOString());
    fetchMock.mockClear();

    const second = await processMetaLeadgenChange(change, new Date().toISOString());
    expect(second.kind).toBe('skipped');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('10/11. unknown page cannot create Lead', async () => {
    vi.spyOn(metaLeadService, 'findMetaConnectionByPageId').mockResolvedValue(null);
    const createSpy = vi.spyOn(metaLeadService, 'createLeadFromExternalSourceDb');

    const result = await processMetaLeadgenChange(change, new Date().toISOString());
    expect(result.kind).toBe('non_retryable');
    expect(result.reason).toBe('page_not_connected');
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('15. Graph failure marks ExternalEvent failed (retryable)', async () => {
    vi.spyOn(metaLeadService, 'findMetaConnectionByPageId').mockResolvedValue({
      id: 'conn-1',
      business_id: 'biz-1',
      user_id: 'user-1',
      page_name: 'Page',
      access_token_encrypted: Buffer.from('token', 'utf8').toString('base64'),
    } as never);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 503,
        text: async () => 'upstream error',
      })),
    );

    const result = await processMetaLeadgenChange(change, new Date().toISOString());
    expect(result.kind).toBe('retryable');
    const event = await getExternalEventById(result.externalEventId!);
    expect(event?.processingStatus).toBe('failed');
    expect(event?.error).not.toMatch(/token/i);
  });

  it('18–20. failed event retry uses same row and one lead', async () => {
    vi.spyOn(metaLeadService, 'findMetaConnectionByPageId').mockResolvedValue({
      id: 'conn-1',
      business_id: 'biz-1',
      user_id: 'user-1',
      page_name: 'Page',
      access_token_encrypted: Buffer.from('token', 'utf8').toString('base64'),
    } as never);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 503,
        text: async () => 'fail',
      })),
    );

    const failed = await processMetaLeadgenChange(change, new Date().toISOString());
    const eventId = failed.externalEventId!;

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ id: 'leadgen-abc', field_data: [{ name: 'full_name', values: ['Bob'] }] }),
      })),
    );

    const createSpy = vi.spyOn(metaLeadService, 'createLeadFromExternalSourceDb').mockResolvedValue({
      id: 'single-lead',
      created: true,
    });

    const success = await processMetaLeadgenChange(change, new Date().toISOString());
    expect(success.kind).toBe('success');
    expect(createSpy).toHaveBeenCalledTimes(1);

    const event = await getExternalEventById(eventId);
    expect(event?.id).toBe(eventId);
    expect(event?.processingStatus).toBe('processed');
  });

  it('24. successful processing touches last_lead_received_at for connection', async () => {
    const touchSpy = vi.spyOn(metaConnectionTimestamps, 'touchMetaConnectionLastLeadReceived');

    vi.spyOn(metaLeadService, 'findMetaConnectionByPageId').mockResolvedValue({
      id: 'conn-touch',
      business_id: 'biz-1',
      user_id: 'user-1',
      page_name: 'Page',
      access_token_encrypted: Buffer.from('token', 'utf8').toString('base64'),
    } as never);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ id: 'leadgen-abc', field_data: [] }),
      })),
    );

    vi.spyOn(metaLeadService, 'createLeadFromExternalSourceDb').mockResolvedValue({
      id: 'lead-1',
      created: true,
    });

    await processMetaLeadgenChange(change, new Date().toISOString());
    expect(touchSpy).toHaveBeenCalledTimes(1);
    expect(touchSpy).toHaveBeenCalledWith('conn-touch', expect.any(String));
  });

  it('failed processing does not touch last_lead_received_at', async () => {
    const touchSpy = vi.spyOn(metaConnectionTimestamps, 'touchMetaConnectionLastLeadReceived');

    vi.spyOn(metaLeadService, 'findMetaConnectionByPageId').mockResolvedValue({
      id: 'conn-touch',
      business_id: 'biz-1',
      user_id: 'user-1',
      page_name: 'Page',
      access_token_encrypted: Buffer.from('token', 'utf8').toString('base64'),
    } as never);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 503,
        text: async () => 'err',
      })),
    );

    await processMetaLeadgenChange(change, new Date().toISOString());
    expect(touchSpy).not.toHaveBeenCalled();
  });

  it('duplicate skip does not touch last_lead_received_at', async () => {
    const touchSpy = vi.spyOn(metaConnectionTimestamps, 'touchMetaConnectionLastLeadReceived');

    vi.spyOn(metaLeadService, 'findMetaConnectionByPageId').mockResolvedValue({
      id: 'conn-touch',
      business_id: 'biz-1',
      user_id: 'user-1',
      page_name: 'Page',
      access_token_encrypted: Buffer.from('t', 'utf8').toString('base64'),
    } as never);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ id: 'leadgen-abc', field_data: [] }),
      })),
    );

    vi.spyOn(metaLeadService, 'createLeadFromExternalSourceDb').mockResolvedValue({
      id: 'lead-1',
      created: true,
    });

    await processMetaLeadgenChange(change, new Date().toISOString());
    touchSpy.mockClear();
    await processMetaLeadgenChange(change, new Date().toISOString());
    expect(touchSpy).not.toHaveBeenCalled();
  });

  it('D. stale processing reclaim completes with one CRM lead', async () => {
    const { claimExternalEventForProcessing, META_LEADGEN_EVENT_TYPE, META_LEAD_PROVIDER } =
      await import('../externalEvents');

    const stuck = await claimExternalEventForProcessing({
      provider: META_LEAD_PROVIDER,
      externalEventId: change.leadgenId,
      eventType: META_LEADGEN_EVENT_TYPE,
      rawPayload: change.rawChange,
    });
    const staleAt = new Date(Date.now() - EXTERNAL_EVENT_STALE_PROCESSING_MS - 60_000).toISOString();
    setExternalEventProcessingClaimedAtForTests(stuck.event.id, staleAt);

    vi.spyOn(metaLeadService, 'findMetaConnectionByPageId').mockResolvedValue({
      id: 'conn-1',
      business_id: 'biz-1',
      user_id: 'user-1',
      page_name: 'Page',
      access_token_encrypted: Buffer.from('token', 'utf8').toString('base64'),
    } as never);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ id: 'leadgen-abc', field_data: [{ name: 'full_name', values: ['Stale'] }] }),
      })),
    );

    const createSpy = vi
      .spyOn(metaLeadService, 'createLeadFromExternalSourceDb')
      .mockResolvedValue({ id: 'one-lead', created: true });

    const result = await processMetaLeadgenChange(change, new Date().toISOString());
    expect(result.kind).toBe('success');
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(result.externalEventId).toBe(stuck.event.id);
  });
});
