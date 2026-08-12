import type { FieldPriority, FieldSection, FieldSource } from './types';

export interface FieldMetaDefaults {
  priority: FieldPriority;
  section: FieldSection;
  visibleByDefault: boolean;
  locked?: boolean;
  /** Skip category row — rendered as built-in Event field */
  bindsToBuiltin?: 'title' | 'date' | 'location' | 'notes';
}

const KEY_META: Record<string, FieldMetaDefaults> = {
  // Core / system
  client_name: { priority: 'core', section: 'client', visibleByDefault: true, locked: true },
  revenue_amount: { priority: 'core', section: 'financial', visibleByDefault: true, locked: true },
  expense_amount: { priority: 'core', section: 'financial', visibleByDefault: false, locked: true },

  // Event model
  event_date: { priority: 'core', section: 'activity_details', visibleByDefault: true, bindsToBuiltin: 'date' },
  event_start_time: { priority: 'primary', section: 'activity_details', visibleByDefault: true },
  event_end_time: { priority: 'primary', section: 'activity_details', visibleByDefault: true },
  event_location: { priority: 'primary', section: 'activity_details', visibleByDefault: true, bindsToBuiltin: 'location' },
  event_type: { priority: 'primary', section: 'business_details', visibleByDefault: true },
  event_package: { priority: 'primary', section: 'business_details', visibleByDefault: true },
  participants_count: { priority: 'optional', section: 'business_details', visibleByDefault: true },
  total_amount: { priority: 'primary', section: 'financial', visibleByDefault: true },
  deposit: { priority: 'primary', section: 'financial', visibleByDefault: true },
  balance_due: { priority: 'optional', section: 'financial', visibleByDefault: true },
  preparation_status: { priority: 'advanced', section: 'advanced', visibleByDefault: false },
  customer_source: { priority: 'advanced', section: 'advanced', visibleByDefault: false },

  // Appointment
  appt_date: { priority: 'core', section: 'activity_details', visibleByDefault: true, bindsToBuiltin: 'date' },
  appt_time: { priority: 'primary', section: 'activity_details', visibleByDefault: true },
  appt_duration: { priority: 'primary', section: 'activity_details', visibleByDefault: true },
  appt_location: { priority: 'primary', section: 'activity_details', visibleByDefault: true, bindsToBuiltin: 'location' },
  appt_type: { priority: 'primary', section: 'business_details', visibleByDefault: true },
  appt_price: { priority: 'primary', section: 'financial', visibleByDefault: true },
  payment_status: { priority: 'optional', section: 'financial', visibleByDefault: false },

  // Journey
  journey_start: { priority: 'primary', section: 'activity_details', visibleByDefault: true, bindsToBuiltin: 'date' },
  journey_end: { priority: 'optional', section: 'activity_details', visibleByDefault: true },
  session_total: { priority: 'primary', section: 'business_details', visibleByDefault: true },
  session_current: { priority: 'optional', section: 'business_details', visibleByDefault: true },
  journey_stage: { priority: 'primary', section: 'business_details', visibleByDefault: true },
  next_meeting: { priority: 'optional', section: 'business_details', visibleByDefault: true },
  next_action: { priority: 'optional', section: 'business_details', visibleByDefault: true },
  journey_value: { priority: 'primary', section: 'financial', visibleByDefault: true },
  journey_payment: { priority: 'optional', section: 'financial', visibleByDefault: false },

  // Package
  package_name: { priority: 'primary', section: 'activity_details', visibleByDefault: true },
  sessions_total: { priority: 'primary', section: 'business_details', visibleByDefault: true },
  sessions_used: { priority: 'optional', section: 'business_details', visibleByDefault: true },
  sessions_remaining: { priority: 'optional', section: 'business_details', visibleByDefault: true },
  purchase_date: { priority: 'optional', section: 'business_details', visibleByDefault: false },
  expiration_date: { priority: 'primary', section: 'business_details', visibleByDefault: true },
  package_price: { priority: 'primary', section: 'financial', visibleByDefault: true },
  package_payment: { priority: 'optional', section: 'financial', visibleByDefault: false },

  // Recurring
  recurrence_pattern: { priority: 'primary', section: 'business_details', visibleByDefault: true },
  recurring_day: { priority: 'primary', section: 'activity_details', visibleByDefault: true },
  recurring_time: { priority: 'primary', section: 'activity_details', visibleByDefault: true },
  recurring_start: { priority: 'primary', section: 'activity_details', visibleByDefault: true, bindsToBuiltin: 'date' },
  recurring_end: { priority: 'optional', section: 'activity_details', visibleByDefault: false },
  recurring_participants: { priority: 'optional', section: 'business_details', visibleByDefault: true },
  recurring_price: { priority: 'primary', section: 'financial', visibleByDefault: true },
  billing_type: { priority: 'optional', section: 'financial', visibleByDefault: false },
  recurring_status: { priority: 'advanced', section: 'advanced', visibleByDefault: false },

  // Project
  project_start: { priority: 'primary', section: 'activity_details', visibleByDefault: true, bindsToBuiltin: 'date' },
  project_deadline: { priority: 'primary', section: 'activity_details', visibleByDefault: true },
  project_stage: { priority: 'primary', section: 'business_details', visibleByDefault: true },
  project_next_action: { priority: 'optional', section: 'business_details', visibleByDefault: true },
  project_owner: { priority: 'optional', section: 'business_details', visibleByDefault: false },
  project_value: { priority: 'primary', section: 'financial', visibleByDefault: true },
  project_payment: { priority: 'optional', section: 'financial', visibleByDefault: false },
  approval_status: { priority: 'advanced', section: 'advanced', visibleByDefault: false },
  delivery_date: { priority: 'optional', section: 'business_details', visibleByDefault: true },

  // Photographer business type
  photo_type: { priority: 'primary', section: 'business_details', visibleByDefault: true },
  shoot_date: { priority: 'optional', section: 'activity_details', visibleByDefault: false },
  shoot_location: { priority: 'optional', section: 'activity_details', visibleByDefault: false },
  delivery_deadline: { priority: 'optional', section: 'business_details', visibleByDefault: false },
  project_stage_photo: { priority: 'optional', section: 'business_details', visibleByDefault: false },
  editing_status: { priority: 'advanced', section: 'advanced', visibleByDefault: false },
  gallery_link: { priority: 'advanced', section: 'advanced', visibleByDefault: false },
  delivery_time: { priority: 'advanced', section: 'advanced', visibleByDefault: false },
  photo_deposit: { priority: 'optional', section: 'financial', visibleByDefault: false },
  photo_balance: { priority: 'optional', section: 'financial', visibleByDefault: false },

  // Notes
  notes_field: { priority: 'optional', section: 'notes', visibleByDefault: false, bindsToBuiltin: 'notes' },
};

const FINANCIAL_NAME_HINTS = [
  'סכום',
  'מחיר',
  'ערך',
  'מקדמה',
  'יתרה',
  'הכנסה',
  'הוצאה',
];

const CLIENT_NAME_HINTS = ['לקוח', 'מטופל', 'מתאמן', 'תלמיד'];
const SOURCE_NAME_HINTS = ['מקור'];
const NOTES_NAME_HINTS = ['הערות'];

function inferSectionFromName(name: string, metricRole: string): FieldSection {
  const n = name.trim();
  if (CLIENT_NAME_HINTS.some((h) => n.includes(h))) return 'client';
  if (SOURCE_NAME_HINTS.some((h) => n.includes(h))) return 'advanced';
  if (NOTES_NAME_HINTS.some((h) => n.includes(h))) return 'notes';
  if (metricRole === 'revenue' || metricRole === 'expense') return 'financial';
  if (FINANCIAL_NAME_HINTS.some((h) => n.includes(h))) return 'financial';
  return 'business_details';
}

function inferPriorityFromMeta(
  section: FieldSection,
  metricRole: string,
  isProtected: boolean,
): FieldPriority {
  if (isProtected) return 'core';
  if (section === 'financial') return metricRole === 'revenue' ? 'primary' : 'optional';
  if (section === 'advanced') return 'advanced';
  if (section === 'notes') return 'optional';
  return 'optional';
}

export function resolveFieldMeta(
  key: string,
  name: string,
  metricRole: string,
  isProtected: boolean,
): FieldMetaDefaults {
  const known = KEY_META[key];
  if (known) return known;

  const section = inferSectionFromName(name, metricRole);
  const priority = inferPriorityFromMeta(section, metricRole, isProtected);
  const visibleByDefault = priority === 'core' || priority === 'primary';

  return { priority, section, visibleByDefault };
}

export function mapTemplateSourceToFieldSource(
  source: string,
  isManual?: boolean,
): FieldSource {
  if (isManual || source === 'manual') return 'user_added';
  if (source === 'core') return 'system';
  if (source === 'business_type') return 'business_recommended';
  return 'model_recommended';
}

export function isClientCategoryKey(key: string, name: string): boolean {
  if (key === 'client_name') return true;
  return CLIENT_NAME_HINTS.some((h) => name.includes(h));
}

export function isSourceFieldKey(key: string, name: string): boolean {
  if (key === 'customer_source') return true;
  return SOURCE_NAME_HINTS.some((h) => name.includes(h));
}

/** System built-in fields always present in event-primary forms */
export function systemBuiltinFields(): Array<{
  key: string;
  label: string;
  builtin: 'title' | 'date';
  priority: FieldPriority;
  section: FieldSection;
  order: number;
}> {
  return [
    {
      key: '__builtin_title',
      label: 'שם הפעילות',
      builtin: 'title' as const,
      priority: 'core' as const,
      section: 'activity_details' as const,
      order: -20,
    },
    {
      key: '__builtin_date',
      label: 'תאריך',
      builtin: 'date' as const,
      priority: 'core' as const,
      section: 'activity_details' as const,
      order: -19,
    },
  ];
}

export function defaultEnabledForDraft(_key: string, meta: FieldMetaDefaults): boolean {
  if (meta.locked) return true;
  if (meta.priority === 'advanced') return false;
  return meta.visibleByDefault;
}

export function recommendedTitleHe(
  businessType: string | undefined,
  operatingModel: string,
): string {
  const presetLabels: Record<string, string> = {
    photographer: 'צלם/ת',
    therapist: 'מטפל/ת',
    coach: 'מאמן/ת',
    consultant: 'יועץ/ת',
    birthday: 'מפעיל/ת אירועים',
    tutor: 'מורה',
    beauty: 'קוסמטיקאית/קוסמטיקאי',
    studio: 'סטודיו',
    design: 'מעצב/ת',
  };
  const modelLabels: Record<string, string> = {
    event: 'באירועים',
    appointment: 'בפגישות',
    journey: 'בתהליכי ליווי',
    package: 'בחבילות',
    recurring: 'בפעילויות קבועות',
    project: 'בפרויקטים',
  };
  const biz = businessType ? presetLabels[businessType] ?? 'עסק שלך' : 'עסק שלך';
  const model = modelLabels[operatingModel] ?? '';
  return model ? `מומלץ ל${biz} ${model}` : `מומלץ ל${biz}`;
}
