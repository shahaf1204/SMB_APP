import type { ActivityFormFieldPresentation } from './types';
import type { OperatingModel } from '../../types/workspace';

export interface PreviewExampleContext {
  businessType?: string;
  operatingModel?: OperatingModel;
}

/** Stable illustrative date for onboarding preview */
export const PREVIEW_SAMPLE_DATE = '14/08/2026';

const KEY_EXAMPLES: Record<string, string> = {
  __builtin_title: 'יום הולדת מאיה',
  __builtin_date: PREVIEW_SAMPLE_DATE,
  __builtin_location: 'גן האירועים רמת אביב',
  __builtin_notes: 'הערות לפני האירוע',
  client_name: 'דנה כהן',
  event_date: PREVIEW_SAMPLE_DATE,
  event_start_time: '16:00',
  event_end_time: '19:00',
  event_location: 'גן האירועים רמת אביב',
  event_type: 'יום הולדת',
  event_package: 'חבילה מלאה',
  participants_count: '20',
  total_amount: '₪3,500',
  revenue_amount: '₪3,500',
  deposit: '₪1,000',
  balance_due: '₪2,500',
  expense_amount: '₪450',
  preparation_status: 'מוכן',
  customer_source: 'המלצה',
  appt_date: PREVIEW_SAMPLE_DATE,
  appt_time: '10:30',
  appt_duration: '60',
  appt_location: 'מרפאה רמת אביב',
  appt_type: 'פגישת ייעוץ',
  appt_price: '₪350',
  payment_status: 'שולם',
  journey_start: PREVIEW_SAMPLE_DATE,
  journey_end: '14/10/2026',
  session_total: '10',
  session_current: '3',
  journey_stage: 'שלב ביניים',
  next_meeting: '21/08/2026',
  journey_value: '₪8,000',
  package_name: 'חבילת 10 מפגשים',
  sessions_total: '10',
  sessions_used: '4',
  sessions_remaining: '6',
  package_price: '₪2,800',
  purchase_date: '01/07/2026',
  expiration_date: '01/01/2027',
  photo_type: 'צילום משפחה',
  shoot_date: PREVIEW_SAMPLE_DATE,
  shoot_location: 'פארק הירקון',
  delivery_deadline: '28/08/2026',
  child_name: 'מאיה',
  child_age: '7',
  project_start: PREVIEW_SAMPLE_DATE,
  project_deadline: '30/09/2026',
  project_value: '₪12,000',
  recurring_time: '18:00',
  recurring_participants: '12',
  recurring_price: '₪280',
};

/** Business-aware title/detail overrides */
const BUSINESS_KEY_EXAMPLES: Record<string, Record<string, string>> = {
  photographer: {
    __builtin_title: 'צילום משפחה',
    photo_type: 'צילום תדמית',
    event_type: 'צילום אירוע',
    event_package: 'חבילת צילום + עריכה',
    total_amount: '₪4,200',
  },
  birthday: {
    __builtin_title: 'יום הולדת מאיה',
    event_type: 'יום הולדת',
    participants_count: '25',
  },
  therapist: {
    __builtin_title: 'פגישת טיפול',
    client_name: 'יעל לוי',
    appt_type: 'טיפול CBT',
  },
  coach: {
    __builtin_title: 'אימון אישי',
    client_name: 'רועי שמש',
  },
  consultant: {
    __builtin_title: 'ליווי עסקי',
    process_topic: 'אסטרategיית שיווק',
  },
};

const MODEL_KEY_EXAMPLES: Record<string, Record<string, string>> = {
  event: {
    __builtin_title: 'יום הולדת מאיה',
  },
  appointment: {
    __builtin_title: 'פגישת היכרות',
    appt_time: '09:00',
  },
  journey: {
    __builtin_title: 'תהליך ליווי',
  },
  package: {
    __builtin_title: 'כרטיסיית 10 מפגשים',
  },
  project: {
    __builtin_title: 'פרויקט מיתוג',
  },
  recurring: {
    __builtin_title: 'חוג שבועי',
  },
};

function exampleFromLabel(label: string, field: ActivityFormFieldPresentation): string {
  const n = label.trim();

  if (/שם|כותר|פעילות|אירוע|פרויקט|חביל|תהליך|חוג|מפגש|צילום/i.test(n) && field.builtin === 'title') {
    return KEY_EXAMPLES.__builtin_title;
  }
  if (n.includes('לקוח') || n.includes('מטופל') || n.includes('מתאמן') || n.includes('תלמיד')) {
    return KEY_EXAMPLES.client_name;
  }
  if (n.includes('תאריך') || field.valueType === 'date') {
    return PREVIEW_SAMPLE_DATE;
  }
  if (n.includes('התחלה') && field.valueType === 'duration') return '16:00';
  if (n.includes('סיום') && field.valueType === 'duration') return '19:00';
  if (n.includes('שעה') || n.includes('שעת') || field.valueType === 'duration') return '16:00';
  if (n.includes('משך')) return '90 דק׳';
  if (n.includes('מיקום') || n.includes('לוקיישן') || n.includes('אונליין')) {
    return KEY_EXAMPLES.event_location;
  }
  if (
    field.metricRole === 'revenue' ||
    n.includes('סכום') ||
    n.includes('מחיר') ||
    n.includes('ערך') ||
    n.includes('מקדמה') ||
    n.includes('יתרה')
  ) {
    if (n.includes('מקדמה')) return KEY_EXAMPLES.deposit;
    if (n.includes('יתרה')) return KEY_EXAMPLES.balance_due;
    return KEY_EXAMPLES.total_amount;
  }
  if (field.metricRole === 'expense') return KEY_EXAMPLES.expense_amount;
  if (n.includes('משתתפ') || n.includes('ילד') || n.includes('מפגש') || n.includes('סבב')) {
    return field.valueType === 'number' ? '20' : '—';
  }
  if (n.includes('סוג') || n.includes('חביל') || n.includes('שירות')) {
    return KEY_EXAMPLES.event_type;
  }
  if (n.includes('שלב') || n.includes('סטטוס')) return 'בתהליך';
  if (n.includes('מקור')) return KEY_EXAMPLES.customer_source;
  if (n.includes('הערות')) return 'הערות קצרות…';
  if (field.valueType === 'number') return '12';
  return 'דוגמה';
}

/**
 * Realistic preview value for onboarding form preview.
 * Uses semantic key first, then business/model context, then label heuristics.
 */
export function resolvePreviewExample(
  field: ActivityFormFieldPresentation,
  context: PreviewExampleContext = {},
): string {
  const { businessType, operatingModel } = context;

  if (KEY_EXAMPLES[field.key]) {
    let value = KEY_EXAMPLES[field.key];
    if (businessType && BUSINESS_KEY_EXAMPLES[businessType]?.[field.key]) {
      value = BUSINESS_KEY_EXAMPLES[businessType][field.key];
    } else if (operatingModel && operatingModel !== 'hybrid' && MODEL_KEY_EXAMPLES[operatingModel]?.[field.key]) {
      value = MODEL_KEY_EXAMPLES[operatingModel][field.key];
    }
    return value;
  }

  if (field.builtin === 'title') {
    if (businessType && BUSINESS_KEY_EXAMPLES[businessType]?.__builtin_title) {
      return BUSINESS_KEY_EXAMPLES[businessType].__builtin_title;
    }
    if (operatingModel && operatingModel !== 'hybrid' && MODEL_KEY_EXAMPLES[operatingModel]?.__builtin_title) {
      return MODEL_KEY_EXAMPLES[operatingModel].__builtin_title;
    }
    return KEY_EXAMPLES.__builtin_title;
  }
  if (field.builtin === 'date') return PREVIEW_SAMPLE_DATE;
  if (field.builtin === 'location') return KEY_EXAMPLES.event_location;
  if (field.builtin === 'notes') return KEY_EXAMPLES.__builtin_notes;

  if (businessType && BUSINESS_KEY_EXAMPLES[businessType]?.[field.key]) {
    return BUSINESS_KEY_EXAMPLES[businessType][field.key];
  }

  return exampleFromLabel(field.label, field);
}

export interface PreviewRow {
  key: string;
  label: string;
  example: string;
}
