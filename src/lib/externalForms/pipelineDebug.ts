export interface PipelineDebugState {
  lastStage: string | null;
  lastWebhookReceivedAt: string | null;
  lastWebhookPreview: string | null;
  lastPollAt: string | null;
  lastPendingCount: number;
  storageBackend: 'supabase' | 'memory' | null;
  lastProcessingStartedAt: string | null;
  lastNormalizedFields: Record<string, string> | null;
  lastRawFieldKeys: string[];
  lastProcessingError: string | null;
  lastCreatedActivityId: string | null;
  lastFailurePayload: unknown;
}

const defaultState: PipelineDebugState = {
  lastStage: null,
  lastWebhookReceivedAt: null,
  lastWebhookPreview: null,
  lastPollAt: null,
  lastPendingCount: 0,
  storageBackend: null,
  lastProcessingStartedAt: null,
  lastNormalizedFields: null,
  lastRawFieldKeys: [],
  lastProcessingError: null,
  lastCreatedActivityId: null,
  lastFailurePayload: null,
};

let state: PipelineDebugState = { ...defaultState };
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

export function getPipelineDebugState(): PipelineDebugState {
  return state;
}

export function subscribePipelineDebug(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function logPipelineStage(
  stage: string,
  detail?: Partial<PipelineDebugState> & { error?: string; payload?: unknown },
): void {
  console.log(`[${stage}]`, detail ?? {});

  const patch: Partial<PipelineDebugState> = {
    lastStage: stage,
    ...detail,
  };

  if (detail?.error) patch.lastProcessingError = detail.error;
  if (detail?.payload !== undefined) patch.lastFailurePayload = detail.payload;

  state = { ...state, ...patch };
  emit();
}

export function patchPipelineDebug(patch: Partial<PipelineDebugState>): void {
  state = { ...state, ...patch };
  emit();
}
