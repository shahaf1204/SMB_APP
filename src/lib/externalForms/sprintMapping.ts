import type { ExternalFormFieldMapping } from '../../types/externalForms';
import { DEFAULT_FORM_FIELD_MAPPINGS } from './normalizeFormFields';

/** Forms.app → app field mapping (Hebrew + English). */
export const FORMS_APP_SPRINT_MAPPING: ExternalFormFieldMapping[] =
  DEFAULT_FORM_FIELD_MAPPINGS as ExternalFormFieldMapping[];

export const SPRINT_REQUIRED_APP_FIELDS = ['clientName', 'clientPhone', 'activityDate'] as const;
