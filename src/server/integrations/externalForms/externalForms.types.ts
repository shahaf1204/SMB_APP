export type ExternalFormProviderId =
  | 'forms_app'
  | 'google_forms'
  | 'typeform'
  | 'jotform'
  | 'tally'
  | 'custom';

export type ExternalFormActivityType = 'event' | 'card' | 'program' | 'course';

export type ExternalFormAppField =
  | 'clientName'
  | 'clientPhone'
  | 'clientEmail'
  | 'activityTitle'
  | 'activityDate'
  | 'activityTime'
  | 'location'
  | 'amount'
  | 'notes'
  | 'participantsCount'
  | 'childName'
  | 'childAge'
  | 'packageName'
  | 'source';

export interface ExternalFormFieldMapping {
  externalField: string;
  appField: ExternalFormAppField;
}

export interface StoredFormConnection {
  id: string;
  businessId: string;
  ownerId: string;
  provider: ExternalFormProviderId;
  formName: string;
  formUrl?: string;
  secretKey: string;
  activityType: ExternalFormActivityType;
  isActive: boolean;
  fieldMapping: ExternalFormFieldMapping[];
}

export interface QueuedFormSubmission {
  id: string;
  connectionId: string;
  businessId: string;
  provider: ExternalFormProviderId;
  externalSubmissionId?: string;
  dedupKey: string;
  rawPayload: unknown;
  receivedAt: string;
  acknowledged: boolean;
}

export interface ExternalFormsDebugState {
  storage: 'supabase' | 'memory';
  storageReason: string;
  pendingCount: number;
  lastWebhookAt: string | null;
  lastWebhookPreview: string | null;
}

export interface WebhookProcessResult {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}
