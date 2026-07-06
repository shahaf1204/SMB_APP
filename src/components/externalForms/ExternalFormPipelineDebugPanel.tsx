import { useEffect, useState } from 'react';
import {
  getPipelineDebugState,
  subscribePipelineDebug,
} from '../../lib/externalForms/pipelineDebug';

export function ExternalFormPipelineDebugPanel() {
  const [state, setState] = useState(getPipelineDebugState());

  useEffect(() => {
    setState(getPipelineDebugState());
    return subscribePipelineDebug(() => setState(getPipelineDebugState()));
  }, []);

  return (
    <section className="card external-form-debug-panel">
      <h2 className="section-title-sm">Debug — Forms.app pipeline</h2>
      <ul className="connect-steps external-form-debug-list">
        <li>
          <strong>Stage:</strong> {state.lastStage ?? '—'}
        </li>
        <li>
          <strong>Storage:</strong> {state.storageBackend ?? '—'}
        </li>
        <li>
          <strong>Last webhook (server):</strong>{' '}
          {state.lastWebhookReceivedAt
            ? new Date(state.lastWebhookReceivedAt).toLocaleString('he-IL')
            : '—'}
        </li>
        <li>
          <strong>Pending (last poll):</strong> {state.lastPendingCount}
        </li>
        <li>
          <strong>Last poll:</strong>{' '}
          {state.lastPollAt ? new Date(state.lastPollAt).toLocaleString('he-IL') : '—'}
        </li>
        <li>
          <strong>Last error:</strong> {state.lastProcessingError ?? '—'}
        </li>
        <li>
          <strong>Last activity id:</strong> {state.lastCreatedActivityId ?? '—'}
        </li>
        <li>
          <strong>Normalized fields:</strong>
          <pre>{JSON.stringify(state.lastNormalizedFields ?? {}, null, 2)}</pre>
        </li>
        <li>
          <strong>Raw field keys:</strong>{' '}
          {state.lastRawFieldKeys.length ? state.lastRawFieldKeys.join(', ') : '—'}
        </li>
        {state.lastWebhookPreview && (
          <li>
            <strong>Last webhook body (preview):</strong>
            <pre>{state.lastWebhookPreview}</pre>
          </li>
        )}
        {state.lastFailurePayload != null && (
          <li>
            <strong>Last failed payload:</strong>
            <pre>{JSON.stringify(state.lastFailurePayload, null, 2)}</pre>
          </li>
        )}
      </ul>
    </section>
  );
}
