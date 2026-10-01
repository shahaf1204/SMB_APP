export {
  EXTERNAL_EVENT_STALE_PROCESSING_MS,
  META_LEADGEN_EVENT_TYPE,
  META_LEAD_PROVIDER,
  metaLeadExternalEventId,
} from './externalEvent.constants.js';

export {
  externalEventProcessingClaimedAt,
  isExternalEventProcessingStale,
} from './externalEventProcessing.policy.js';

export type {
  ExternalEventProcessingClaim,
  ExternalEventProcessingStatus,
  ExternalEventReceiveOutcome,
  ExternalEventRecord,
  ReceiveExternalEventInput,
  ReceiveExternalEventResult,
} from './externalEvent.types.js';

export {
  claimExternalEventForProcessing,
  getExternalEventById,
  markExternalEventFailed,
  markExternalEventProcessed,
  markExternalEventProcessing,
  receiveExternalEvent,
  resetExternalEventMemoryStoreForTests,
  setExternalEventProcessingClaimedAtForTests,
} from './externalEvent.store.js';
