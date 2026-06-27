import type { ExternalFormAppField } from '../../types/externalForms';

export const APP_FIELD_OPTIONS: Array<{ value: ExternalFormAppField; label: string }> = [
  { value: 'clientName', label: 'שם לקוח' },
  { value: 'clientPhone', label: 'טלפון' },
  { value: 'clientEmail', label: 'אימייל' },
  { value: 'activityTitle', label: 'שם פעילות' },
  { value: 'activityDate', label: 'תאריך פעילות' },
  { value: 'activityTime', label: 'שעה' },
  { value: 'location', label: 'מיקום' },
  { value: 'amount', label: 'סכום' },
  { value: 'notes', label: 'הערות' },
  { value: 'participantsCount', label: 'מספר משתתפים' },
  { value: 'childName', label: 'שם ילד/ה' },
  { value: 'childAge', label: 'גיל ילד/ה' },
  { value: 'packageName', label: 'שם חבילה' },
  { value: 'source', label: 'מקור' },
];

export const BIRTHDAY_PARTY_DEFAULT_MAPPING: Array<{
  externalField: string;
  appField: ExternalFormAppField;
}> = [
  { externalField: 'שם ההורה', appField: 'clientName' },
  { externalField: 'טלפון', appField: 'clientPhone' },
  { externalField: 'אימייל', appField: 'clientEmail' },
  { externalField: 'שם הילד/ה', appField: 'childName' },
  { externalField: 'גיל הילד/ה', appField: 'childAge' },
  { externalField: 'תאריך האירוע', appField: 'activityDate' },
  { externalField: 'שעת האירוע', appField: 'activityTime' },
  { externalField: 'מיקום האירוע', appField: 'location' },
  { externalField: 'מספר משתתפים', appField: 'participantsCount' },
  { externalField: 'חבילת פעילות', appField: 'packageName' },
  { externalField: 'הערות', appField: 'notes' },
];

export function appFieldLabel(field: ExternalFormAppField): string {
  return APP_FIELD_OPTIONS.find((o) => o.value === field)?.label ?? field;
}
