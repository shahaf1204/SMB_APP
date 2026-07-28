import { CUSTOMER_SOURCE_CATEGORY_NAME } from '../data/leadSources';
import type { CategoryTemplate } from '../types/onboarding';
import type { OperatingModel } from '../types/workspace';

function tpl(
  key: string,
  name: string,
  valueType: CategoryTemplate['valueType'],
  metricRole: CategoryTemplate['metricRole'],
  source: CategoryTemplate['source'],
  opts: Partial<Pick<CategoryTemplate, 'isProtected' | 'isRequired' | 'sortPriority'>> = {},
): CategoryTemplate {
  return { key, name, valueType, metricRole, source, ...opts };
}

/** Core fields required for app functionality */
export const CORE_CATEGORY_TEMPLATES: CategoryTemplate[] = [
  tpl('client_name', 'שם לקוח', 'text', 'neutral', 'core', {
    isProtected: true,
    isRequired: true,
    sortPriority: 10,
  }),
  tpl('revenue_amount', 'סכום הכנסה', 'number', 'revenue', 'core', {
    isProtected: true,
    isRequired: true,
    sortPriority: 900,
  }),
  tpl('expense_amount', 'סכום הוצאה', 'number', 'expense', 'core', {
    isProtected: true,
    sortPriority: 910,
  }),
  tpl('customer_source', CUSTOMER_SOURCE_CATEGORY_NAME, 'text', 'neutral', 'core', {
    isProtected: true,
    sortPriority: 920,
  }),
  tpl('notes_field', 'הערות נוספות', 'text', 'neutral', 'generic', {
    sortPriority: 950,
  }),
];

export const OPERATING_MODEL_CATEGORY_TEMPLATES: Record<
  Exclude<OperatingModel, 'hybrid'>,
  CategoryTemplate[]
> = {
  event: [
    tpl('event_date', 'תאריך האירוע', 'date', 'neutral', 'operating_model', { sortPriority: 20 }),
    tpl('event_start_time', 'שעת התחלה', 'duration', 'neutral', 'operating_model', { sortPriority: 30 }),
    tpl('event_end_time', 'שעת סיום', 'duration', 'neutral', 'operating_model', { sortPriority: 40 }),
    tpl('event_location', 'מיקום', 'text', 'neutral', 'operating_model', { sortPriority: 50 }),
    tpl('participants_count', 'מספר משתתפים', 'number', 'neutral', 'operating_model', { sortPriority: 60 }),
    tpl('event_type', 'סוג אירוע', 'text', 'neutral', 'operating_model', { sortPriority: 70 }),
    tpl('event_package', 'חבילה או שירות', 'text', 'neutral', 'operating_model', { sortPriority: 80 }),
    tpl('total_amount', 'סכום כולל', 'number', 'revenue', 'operating_model', { sortPriority: 100 }),
    tpl('deposit', 'מקדמה', 'number', 'revenue', 'operating_model', { sortPriority: 110 }),
    tpl('balance_due', 'יתרה לתשלום', 'number', 'revenue', 'operating_model', { sortPriority: 120 }),
    tpl('preparation_status', 'סטטוס הכנה', 'text', 'neutral', 'operating_model', { sortPriority: 130 }),
  ],
  appointment: [
    tpl('appt_date', 'תאריך', 'date', 'neutral', 'operating_model', { sortPriority: 20 }),
    tpl('appt_time', 'שעה', 'duration', 'neutral', 'operating_model', { sortPriority: 30 }),
    tpl('appt_duration', 'משך', 'duration', 'neutral', 'operating_model', { sortPriority: 40 }),
    tpl('appt_location', 'מיקום או אונליין', 'text', 'neutral', 'operating_model', { sortPriority: 50 }),
    tpl('appt_type', 'סוג פגישה', 'text', 'neutral', 'operating_model', { sortPriority: 60 }),
    tpl('appt_price', 'מחיר הפגישה', 'number', 'revenue', 'operating_model', { sortPriority: 100 }),
    tpl('payment_status', 'סטטוס תשלום', 'text', 'neutral', 'operating_model', { sortPriority: 110 }),
  ],
  journey: [
    tpl('journey_start', 'תאריך התחלה', 'date', 'neutral', 'operating_model', { sortPriority: 20 }),
    tpl('journey_end', 'תאריך סיום משוער', 'date', 'neutral', 'operating_model', { sortPriority: 30 }),
    tpl('session_total', 'מספר מפגשים', 'number', 'neutral', 'operating_model', { sortPriority: 40 }),
    tpl('session_current', 'מפגש נוכחי', 'number', 'neutral', 'operating_model', { sortPriority: 50 }),
    tpl('journey_stage', 'שלב בתהליך', 'text', 'neutral', 'operating_model', { sortPriority: 60 }),
    tpl('next_meeting', 'הפגישה הבאה', 'date', 'neutral', 'operating_model', { sortPriority: 70 }),
    tpl('next_action', 'הפעולה הבאה', 'text', 'neutral', 'operating_model', { sortPriority: 80 }),
    tpl('journey_value', 'ערך התהליך', 'number', 'revenue', 'operating_model', { sortPriority: 100 }),
    tpl('journey_payment', 'סטטוס תשלום', 'text', 'neutral', 'operating_model', { sortPriority: 110 }),
  ],
  package: [
    tpl('package_name', 'שם החבילה', 'text', 'neutral', 'operating_model', { sortPriority: 15 }),
    tpl('sessions_total', 'מספר מפגשים כולל', 'number', 'neutral', 'operating_model', { sortPriority: 40 }),
    tpl('sessions_used', 'מפגשים שנוצלו', 'number', 'neutral', 'operating_model', { sortPriority: 50 }),
    tpl('sessions_remaining', 'מפגשים שנותרו', 'number', 'neutral', 'operating_model', { sortPriority: 60 }),
    tpl('purchase_date', 'תאריך רכישה', 'date', 'neutral', 'operating_model', { sortPriority: 70 }),
    tpl('expiration_date', 'תאריך תפוגה', 'date', 'neutral', 'operating_model', { sortPriority: 80 }),
    tpl('package_price', 'מחיר החבילה', 'number', 'revenue', 'operating_model', { sortPriority: 100 }),
    tpl('package_payment', 'סטטוס תשלום', 'text', 'neutral', 'operating_model', { sortPriority: 110 }),
  ],
  recurring: [
    tpl('recurrence_pattern', 'דפוס חזרה', 'text', 'neutral', 'operating_model', { sortPriority: 20 }),
    tpl('recurring_day', 'יום קבוע', 'text', 'neutral', 'operating_model', { sortPriority: 30 }),
    tpl('recurring_time', 'שעה', 'duration', 'neutral', 'operating_model', { sortPriority: 40 }),
    tpl('recurring_start', 'תאריך התחלה', 'date', 'neutral', 'operating_model', { sortPriority: 50 }),
    tpl('recurring_end', 'תאריך סיום', 'date', 'neutral', 'operating_model', { sortPriority: 60 }),
    tpl('recurring_participants', 'מספר משתתפים', 'number', 'neutral', 'operating_model', { sortPriority: 70 }),
    tpl('recurring_price', 'מחיר', 'number', 'revenue', 'operating_model', { sortPriority: 100 }),
    tpl('billing_type', 'סוג גבייה', 'text', 'neutral', 'operating_model', { sortPriority: 110 }),
    tpl('recurring_status', 'סטטוס פעילות', 'text', 'neutral', 'operating_model', { sortPriority: 120 }),
  ],
  project: [
    tpl('project_start', 'תאריך התחלה', 'date', 'neutral', 'operating_model', { sortPriority: 20 }),
    tpl('project_deadline', 'דדליין', 'date', 'neutral', 'operating_model', { sortPriority: 30 }),
    tpl('project_stage', 'שלב נוכחי', 'text', 'neutral', 'operating_model', { sortPriority: 40 }),
    tpl('project_next_action', 'הפעולה הבאה', 'text', 'neutral', 'operating_model', { sortPriority: 50 }),
    tpl('project_owner', 'אחראי', 'text', 'neutral', 'operating_model', { sortPriority: 60 }),
    tpl('project_value', 'ערך הפרויקט', 'number', 'revenue', 'operating_model', { sortPriority: 100 }),
    tpl('project_payment', 'סטטוס תשלום', 'text', 'neutral', 'operating_model', { sortPriority: 110 }),
    tpl('approval_status', 'סטטוס אישור', 'text', 'neutral', 'operating_model', { sortPriority: 120 }),
    tpl('delivery_date', 'תאריך מסירה', 'date', 'neutral', 'operating_model', { sortPriority: 130 }),
  ],
};

/** Business-type-specific suggestions (preset id keys) */
export const BUSINESS_TYPE_CATEGORY_TEMPLATES: Record<string, CategoryTemplate[]> = {
  birthday: [
    tpl('child_name', 'שם הילד/ה', 'text', 'neutral', 'business_type', { sortPriority: 25 }),
    tpl('child_age', 'גיל', 'number', 'neutral', 'business_type', { sortPriority: 35 }),
    tpl('entertainment_package', 'חבילת הפעלה', 'text', 'neutral', 'business_type', { sortPriority: 85 }),
    tpl('equipment_needed', 'ציוד נדרש', 'text', 'neutral', 'business_type', { sortPriority: 90 }),
  ],
  photographer: [
    tpl('photo_type', 'סוג צילום', 'text', 'neutral', 'business_type', { sortPriority: 25 }),
    tpl('shoot_location', 'לוקיישן', 'text', 'neutral', 'business_type', { sortPriority: 55 }),
    tpl('delivery_time', 'זמן אספקה', 'text', 'neutral', 'business_type', { sortPriority: 140 }),
    tpl('gallery_link', 'קישור לגלריה', 'text', 'neutral', 'business_type', { sortPriority: 150 }),
    tpl('editing_status', 'סטטוס עריכה', 'text', 'neutral', 'business_type', { sortPriority: 160 }),
  ],
  therapist: [
    tpl('treatment_type', 'סוג טיפול', 'text', 'neutral', 'business_type', { sortPriority: 25 }),
    tpl('session_number', 'מספר מפגש', 'number', 'neutral', 'business_type', { sortPriority: 45 }),
    tpl('meeting_mode', 'אופן פגישה', 'text', 'neutral', 'business_type', { sortPriority: 55 }),
    tpl('focus_topic', 'נושא מרכזי', 'text', 'neutral', 'business_type', { sortPriority: 65 }),
    tpl('followup_notes', 'מעקב לפגישה הבאה', 'text', 'neutral', 'business_type', { sortPriority: 140 }),
  ],
  coach: [
    tpl('training_type', 'סוג אימון', 'text', 'neutral', 'business_type', { sortPriority: 25 }),
    tpl('training_number', 'מספר אימון', 'number', 'neutral', 'business_type', { sortPriority: 45 }),
    tpl('goal', 'יעד', 'text', 'neutral', 'business_type', { sortPriority: 55 }),
    tpl('sessions_count', 'מספר מפגשים', 'number', 'neutral', 'business_type', { sortPriority: 65 }),
    tpl('sessions_balance', 'יתרת מפגשים', 'number', 'neutral', 'business_type', { sortPriority: 75 }),
  ],
  consultant: [
    tpl('process_topic', 'נושא התהליך', 'text', 'neutral', 'business_type', { sortPriority: 25 }),
    tpl('consult_stage', 'שלב', 'text', 'neutral', 'business_type', { sortPriority: 45 }),
    tpl('required_docs', 'מסמכים נדרשים', 'text', 'neutral', 'business_type', { sortPriority: 55 }),
    tpl('consult_next_action', 'פעולה הבאה', 'text', 'neutral', 'business_type', { sortPriority: 75 }),
    tpl('target_date', 'תאריך יעד', 'date', 'neutral', 'business_type', { sortPriority: 85 }),
  ],
  tutor: [
    tpl('subject', 'מקצוע', 'text', 'neutral', 'business_type', { sortPriority: 25 }),
    tpl('study_hours', 'שעות לימוד', 'duration', 'neutral', 'business_type', { sortPriority: 45 }),
  ],
  beauty: [
    tpl('treatment_name', 'סוג טיפול', 'text', 'neutral', 'business_type', { sortPriority: 25 }),
    tpl('product_used', 'מוצר בשימוש', 'text', 'neutral', 'business_type', { sortPriority: 35 }),
  ],
  studio: [
    tpl('class_name', 'שם החוג', 'text', 'neutral', 'business_type', { sortPriority: 15 }),
    tpl('group_size', 'גודל קבוצה', 'number', 'neutral', 'business_type', { sortPriority: 65 }),
  ],
  design: [
    tpl('deliverable', 'תוצר', 'text', 'neutral', 'business_type', { sortPriority: 25 }),
    tpl('revision_round', 'סבב תיקונים', 'number', 'neutral', 'business_type', { sortPriority: 45 }),
  ],
};

/** Badge labels for category source */
export const CATEGORY_SOURCE_BADGE_HE: Record<
  CategoryTemplate['source'],
  string
> = {
  core: 'שדה בסיסי',
  generic: 'כללי',
  business_type: 'מומלץ לעסק שלך',
  operating_model: 'מתאים לצורת העבודה',
  manual: 'נוסף ידנית',
};
