import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  META_LEADGEN_EVENT_TYPE,
  META_LEAD_PROVIDER,
  metaLeadExternalEventId,
} from './externalEvent.constants';
import { EXTERNAL_EVENT_STALE_PROCESSING_MS } from './externalEvent.constants';
import {
  claimExternalEventForProcessing,
  getExternalEventById,
  markExternalEventFailed,
  markExternalEventProcessed,
  markExternalEventProcessing,
  receiveExternalEvent,
  resetExternalEventMemoryStoreForTests,
  setExternalEventProcessingClaimedAtForTests,
} from './externalEvent.store';

describe('External event store (memory — DB uniqueness contract)', () => {
  beforeEach(() => {
    resetExternalEventMemoryStoreForTests();
  });

  afterEach(() => {
    resetExternalEventMemoryStoreForTests();
  });

  it('A. creates external event with received status', async () => {
    const result = await receiveExternalEvent({
      provider: META_LEAD_PROVIDER,
      externalEventId: metaLeadExternalEventId('leadgen-100'),
      eventType: META_LEADGEN_EVENT_TYPE,
      businessId: 'biz-1',
      rawPayload: { leadgen_id: 'leadgen-100' },
    });

    expect(result.outcome).toBe('created');
    expect(result.event.processingStatus).toBe('received');
    expect(result.event.processed).toBe(false);
    expect(result.event.provider).toBe('meta');
    expect(result.event.externalEventId).toBe('leadgen-100');
  });

  it('B/C. duplicate provider + externalEventId returns duplicate outcome', async () => {
    const input = {
      provider: META_LEAD_PROVIDER,
      externalEventId: metaLeadExternalEventId('leadgen-dup'),
      eventType: META_LEADGEN_EVENT_TYPE,
    };

    const first = await receiveExternalEvent(input);
    const second = await receiveExternalEvent(input);

    expect(first.outcome).toBe('created');
    expect(second.outcome).toBe('duplicate');
    expect(second.event.id).toBe(first.event.id);
  });

  it('D. received → processing', async () => {
    const { event } = await receiveExternalEvent({
      provider: META_LEAD_PROVIDER,
      externalEventId: 'leadgen-proc',
      eventType: META_LEADGEN_EVENT_TYPE,
    });

    const processing = await markExternalEventProcessing(event.id);
    expect(processing.processingStatus).toBe('processing');
    expect(processing.processed).toBe(false);
  });

  it('E. processing → processed with leadId', async () => {
    const { event } = await receiveExternalEvent({
      provider: META_LEAD_PROVIDER,
      externalEventId: 'leadgen-done',
      eventType: META_LEADGEN_EVENT_TYPE,
    });
    await markExternalEventProcessing(event.id);

    const processed = await markExternalEventProcessed(event.id, {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      businessId: 'biz-9',
    });

    expect(processed.processingStatus).toBe('processed');
    expect(processed.processed).toBe(true);
    expect(processed.processedAt).toBeTruthy();
    expect(processed.leadId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(processed.businessId).toBe('biz-9');
  });

  it('F/G. processing → failed persists error', async () => {
    const { event } = await receiveExternalEvent({
      provider: META_LEAD_PROVIDER,
      externalEventId: 'leadgen-fail',
      eventType: META_LEADGEN_EVENT_TYPE,
    });
    await markExternalEventProcessing(event.id);

    const failed = await markExternalEventFailed(event.id, 'graph_fetch_failed');
    expect(failed.processingStatus).toBe('failed');
    expect(failed.error).toBe('graph_fetch_failed');
    expect(failed.processed).toBe(false);
  });

  it('failed ExternalEvent can be reclaimed for retry (same row)', async () => {
    const input = {
      provider: META_LEAD_PROVIDER,
      externalEventId: 'leadgen-retry',
      eventType: META_LEADGEN_EVENT_TYPE,
    };

    const first = await claimExternalEventForProcessing(input);
    expect(first.action).toBe('process');
    await markExternalEventFailed(first.event.id, 'graph_down');

    const second = await claimExternalEventForProcessing(input);
    expect(second.action).toBe('process');
    expect(second.reason).toBe('retry_failed');
    expect(second.event.id).toBe(first.event.id);
  });

  it('processed duplicate skips processing', async () => {
    const input = {
      provider: META_LEAD_PROVIDER,
      externalEventId: 'leadgen-done-dup',
      eventType: META_LEADGEN_EVENT_TYPE,
    };

    const first = await claimExternalEventForProcessing(input);
    await markExternalEventProcessed(first.event.id, { leadId: 'lead-uuid' });

    const second = await claimExternalEventForProcessing(input);
    expect(second.action).toBe('skip');
    expect(second.reason).toBe('already_processed');
  });

  it('A. recent processing event is not reclaimed (in_progress skip)', async () => {
    const input = {
      provider: META_LEAD_PROVIDER,
      externalEventId: 'leadgen-in-flight',
      eventType: META_LEADGEN_EVENT_TYPE,
    };

    const first = await claimExternalEventForProcessing(input);
    expect(first.action).toBe('process');

    const second = await claimExternalEventForProcessing(input);
    expect(second.action).toBe('skip');
    expect(second.reason).toBe('in_progress');
  });

  it('B/C. stale processing event is reclaimed on same row', async () => {
    const input = {
      provider: META_LEAD_PROVIDER,
      externalEventId: 'leadgen-stale',
      eventType: META_LEADGEN_EVENT_TYPE,
    };

    const first = await claimExternalEventForProcessing(input);
    const staleAt = new Date(
      Date.now() - EXTERNAL_EVENT_STALE_PROCESSING_MS - 60_000,
    ).toISOString();
    setExternalEventProcessingClaimedAtForTests(first.event.id, staleAt);

    const second = await claimExternalEventForProcessing(input);
    expect(second.action).toBe('process');
    expect(second.reason).toBe('retry_stale_processing');
    expect(second.event.id).toBe(first.event.id);
  });

  it('retrieves event by id', async () => {
    const { event } = await receiveExternalEvent({
      provider: META_LEAD_PROVIDER,
      externalEventId: 'leadgen-get',
      eventType: META_LEADGEN_EVENT_TYPE,
    });

    const loaded = await getExternalEventById(event.id);
    expect(loaded?.externalEventId).toBe('leadgen-get');
  });
});
