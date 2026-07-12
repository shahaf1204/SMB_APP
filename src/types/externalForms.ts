export type ExternalFormProviderId =
  | 'forms_app'
  | 'google_forms'
  | 'typeform'
  | 'jotform'
  | 'tally'
  | 'custom';

export type ExternalFormActivityType = 'event' | 'card' | 'program' | 'course';

export type ExternalFormSubmissionStatus = 'received' | 'mapped' | 'created' | 'failed';

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

export interface ExternalFormConnection {
  id: string;
  businessId: string;
  ownerId: string;
  provider: ExternalFormProviderId;
  formName: string;
  formUrl?: string;
  webhookUrl: string;
  secretKey: string;
  activityType: ExternalFormActivityType;
  isActive: boolean;
  fieldMapping: ExternalFormFieldMapping[];
  createdAt: string;
  updatedAt: string;
  lastSubmissionAt?: string;
  submissionCount: number;
}

export interface ExternalFormSubmission {
  id: string;
  businessId: string;
  connectionId: string;
  provider: ExternalFormProviderId;
  externalSubmissionId?: string;
  rawPayload: unknown;
  normalizedPayload: NormalizedFormPayload;
  createdActivityId?: string;
  createdClientId?: string;
  status: ExternalFormSubmissionStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NormalizedFormPayload {
  externalSubmissionId?: string;
  fields: Partial<Record<ExternalFormAppField, string>>;
  unmapped: Record<string, string>;
  submittedAt?: string;
  sourceProvider: ExternalFormProviderId;
}

export interface FormActivityNotification {
  id: string;
  message: string;
  connectionId: string;
  activityId?: string;
  createdAt: string;
  read: boolean;
  /** User confirmed they reviewed / followed up */
  handled?: boolean;
  sourceLabel?: string;
  formName?: string;
  clientName?: string;
  clientPhone?: string;
  missingFields?: string[];
}

export const EXTERNAL_FORM_PROVIDER_LABELS: Record<ExternalFormProviderId, string> = {
  forms_app: 'forms.app',
  google_forms: 'Google Forms',
  typeform: 'Typeform',
  jotform: 'Jotform',
  tally: 'Tally',
  custom: 'Webhook מותאם',
};

export const EXTERNAL_FORM_ACTIVITY_LABELS: Record<ExternalFormActivityType, string> = {
  event: 'אירוע',
  card: 'כרטיסייה',
  program: 'ליווי',
  course: 'חוג',
};
