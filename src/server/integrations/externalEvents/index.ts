export {
  EXTERNAL_EVENT_STALE_PROCESSING_MS,
  META_LEADGEN_EVENT_TYPE,
  META_LEAD_PROVIDER,
  metaLeadExternalEventId,
} from './externalEvent.constants';

export {
  externalEventProcessingClaimedAt,
  isExternalEventProcessingStale,
} from './externalEventProcessing.policy';

export type {
  ExternalEventProcessingClaim,
  ExternalEventProcessingStatus,
  ExternalEventReceiveOutcome,
  ExternalEventRecord,
  ReceiveExternalEventInput,
  ReceiveExternalEventResult,
} from './externalEvent.types';

export {
  claimExternalEventForProcessing,
  getExternalEventById,
  markExternalEventFailed,
  markExternalEventProcessed,
  markExternalEventProcessing,
  receiveExternalEvent,
  resetExternalEventMemoryStoreForTests,
  setExternalEventProcessingClaimedAtForTests,
} from './externalEvent.store';
