import { useCallback, useEffect, useState } from 'react';
import {
  getPipelineDebugState,
  patchPipelineDebug,
  subscribePipelineDebug,
} from '../../lib/externalForms/pipelineDebug';
import {
  fetchSupabaseEnvDiagnostics,
  type SupabaseEnvDiagnosticsResponse,
} from '../../lib/externalForms/supabaseEnvDiagnostics';

function boolLabel(value: boolean | undefined): string {
  if (value === undefined) return '—';
  return value ? 'true' : 'false';
}

export function ExternalFormPipelineDebugPanel() {
  const [state, setState] = useState(getPipelineDebugState());
  const [envDiag, setEnvDiag] = useState<SupabaseEnvDiagnosticsResponse | null>(
    state.supabaseEnvDiagnostics,
  );

  const refreshEnvDiagnostics = useCallback(async () => {
    const diagnostics = await fetchSupabaseEnvDiagnostics();
    setEnvDiag(diagnostics);
    patchPipelineDebug({ supabaseEnvDiagnostics: diagnostics });
  }, []);

  useEffect(() => {
    setState(getPipelineDebugState());
    return subscribePipelineDebug(() => setState(getPipelineDebugState()));
  }, []);

  useEffect(() => {
    void refreshEnvDiagnostics();
    const interval = window.setInterval(() => void refreshEnvDiagnostics(), 15_000);
    return () => window.clearInterval(interval);
  }, [refreshEnvDiagnostics]);

  const diag = envDiag ?? state.supabaseEnvDiagnostics;
  const diagOk = diag?.ok === true ? diag : null;
  const diagFail = diag?.ok === false ? diag : null;

  const storageReason =
    diagOk?.storageBackendReason ??
    (diagFail ? `endpoint error — ${diagFail.error}` : null) ??
    state.storageBackendReason ??
    (state.storageBackend === 'memory'
      ? 'memory — poll reported in-memory storage (see Supabase diagnostics below)'
      : null);

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
          <strong>Storage reason:</strong> {storageReason ?? '—'}
        </li>
        <li>
          <strong>Diagnostics ok:</strong> {diag ? boolLabel(diag.ok) : '—'}
        </li>
        {diagFail && (
          <>
            <li>
              <strong>Init error:</strong> {diagFail.error}
            </li>
            <li>
              <strong>Init stack:</strong>
              <pre>{diagFail.stack || '—'}</pre>
            </li>
          </>
        )}
        <li>
          <strong>supabaseUrlExists:</strong> {boolLabel(diagOk?.supabaseUrlExists)}
        </li>
        <li>
          <strong>serviceRoleExists:</strong> {boolLabel(diagOk?.serviceRoleExists)}
        </li>
        <li>
          <strong>supabaseUrlLooksValid:</strong> {boolLabel(diagOk?.supabaseUrlLooksValid)}
        </li>
        <li>
          <strong>serviceRoleLooksValid:</strong> {boolLabel(diagOk?.serviceRoleLooksValid)}
        </li>
        <li>
          <strong>supabaseClientCreated:</strong> {boolLabel(diagOk?.supabaseClientCreated)}
        </li>
        <li>
          <strong>testQuerySuccess:</strong> {boolLabel(diagOk?.testQuerySuccess)}
        </li>
        <li>
          <strong>testQueryError:</strong> {diagOk?.testQueryError || diagFail?.error || '—'}
        </li>
        <li>
          <strong>nodeEnv:</strong> {diagOk?.nodeEnv || diagFail?.nodeEnv || '—'}
        </li>
        <li>
          <strong>vercelEnv:</strong> {diagOk?.vercelEnv || diagFail?.vercelEnv || '—'}
        </li>
        <li>
          <strong>deploymentUrl:</strong> {diagOk?.deploymentUrl || '—'}
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
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => void refreshEnvDiagnostics()}>
        Refresh Supabase diagnostics
      </button>
    </section>
  );
}
