import { describe, expect, it } from 'vitest';
import { parseMetaLeadgenChanges } from './metaWebhook.parse';
import {
  processMetaLeadgenWebhookBatch,
  resolveMetaLeadgenBatchHttpStatus,
  type MetaLeadProcessingResult,
} from './metaLead.processor';

describe('resolveMetaLeadgenBatchHttpStatus', () => {
  const result = (kind: MetaLeadProcessingResult['kind']): MetaLeadProcessingResult => ({
    leadgenId: 'x',
    kind,
  });

  it('A. all successful results → HTTP 200', () => {
    expect(resolveMetaLeadgenBatchHttpStatus([result('success'), result('success')])).toBe(200);
  });

  it('B. processed duplicate/skipped → HTTP 200', () => {
    expect(resolveMetaLeadgenBatchHttpStatus([result('skipped'), result('success')])).toBe(200);
  });

  it('C. non-retryable failure → HTTP 200', () => {
    expect(
      resolveMetaLeadgenBatchHttpStatus([result('non_retryable'), result('success')]),
    ).toBe(200);
  });

  it('D. any retryable failure → HTTP 503', () => {
    expect(resolveMetaLeadgenBatchHttpStatus([result('retryable')])).toBe(503);
  });

  it('E. mixed success + retryable failure → HTTP 503', () => {
    expect(
      resolveMetaLeadgenBatchHttpStatus([
        result('success'),
        result('skipped'),
        result('retryable'),
      ]),
    ).toBe(503);
  });
});

describe('processMetaLeadgenWebhookBatch', () => {
  it('F. empty batch → HTTP 200', async () => {
    const { httpStatus, results } = await processMetaLeadgenWebhookBatch([], '2026-01-01T00:00:00.000Z');
    expect(httpStatus).toBe(200);
    expect(results).toEqual([]);
  });

  it('F. unrelated webhook payload → no leadgen rows → HTTP 200 contract', () => {
    const changes = parseMetaLeadgenChanges({
      entry: [{ changes: [{ field: 'feed', value: {} as never }] }],
    });
    expect(changes).toEqual([]);
    expect(resolveMetaLeadgenBatchHttpStatus([])).toBe(200);
  });

});
