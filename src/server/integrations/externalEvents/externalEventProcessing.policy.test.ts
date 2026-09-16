import { describe, expect, it } from 'vitest';
import { EXTERNAL_EVENT_STALE_PROCESSING_MS } from './externalEvent.constants';
import {
  externalEventProcessingClaimedAt,
  isExternalEventProcessingStale,
} from './externalEventProcessing.policy';

describe('externalEventProcessing.policy', () => {
  it('uses processingClaimedAt when present', () => {
    expect(
      externalEventProcessingClaimedAt({
        processingClaimedAt: '2026-01-02T00:00:00.000Z',
        receivedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toBe('2026-01-02T00:00:00.000Z');
  });

  it('recent processing is not stale', () => {
    const now = Date.parse('2026-01-01T00:10:00.000Z');
    const event = {
      processingClaimedAt: '2026-01-01T00:05:00.000Z',
      receivedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(isExternalEventProcessingStale(event, now)).toBe(false);
  });

  it('processing older than threshold is stale', () => {
    const claimed = '2026-01-01T00:00:00.000Z';
    const now = Date.parse(claimed) + EXTERNAL_EVENT_STALE_PROCESSING_MS + 1;
    expect(
      isExternalEventProcessingStale(
        { processingClaimedAt: claimed, receivedAt: claimed },
        now,
      ),
    ).toBe(true);
  });
});
