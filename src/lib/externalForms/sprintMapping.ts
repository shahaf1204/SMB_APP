import type { ExternalFormFieldMapping } from '../../types/externalForms';

/** Sprint 1 fixed mapping — Forms.app field labels (English + Hebrew aliases). */
export const FORMS_APP_SPRINT_MAPPING: ExternalFormFieldMapping[] = [
  { externalField: 'Parent Name', appField: 'clientName' },
  { externalField: 'שם ההורה', appField: 'clientName' },
  { externalField: 'Phone', appField: 'clientPhone' },
  { externalField: 'טלפון', appField: 'clientPhone' },
  { externalField: 'Email', appField: 'clientEmail' },
  { externalField: 'אימייל', appField: 'clientEmail' },
  { externalField: 'Event Date', appField: 'activityDate' },
  { externalField: 'תאריך האירוע', appField: 'activityDate' },
  { externalField: 'Event Time', appField: 'activityTime' },
  { externalField: 'שעת האירוע', appField: 'activityTime' },
  { externalField: 'Location', appField: 'location' },
  { externalField: 'מיקום האירוע', appField: 'location' },
  { externalField: 'Notes', appField: 'notes' },
  { externalField: 'הערות', appField: 'notes' },
  { externalField: 'Child Name', appField: 'childName' },
  { externalField: 'שם הילד/ה', appField: 'childName' },
];

export const SPRINT_REQUIRED_APP_FIELDS = ['clientName', 'clientPhone', 'activityDate'] as const;
