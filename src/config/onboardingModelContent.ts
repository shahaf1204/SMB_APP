import type { OperatingModel } from '../types/workspace';

export interface OnboardingModelPreview {
  dashboard: string;
  view: string;
  primaryAction: string;
  tracking: string;
}

export interface OnboardingModelContent {
  examplesHe: string;
  preview: OnboardingModelPreview;
  expansionItems: string[];
}

export const ONBOARDING_MODEL_CONTENT: Record<OperatingModel, OnboardingModelContent> = {
  event: {
    examplesHe: 'ימי הולדת, הפקות, סדנאות, הרצאות, ימי צילום.',
    preview: {
      dashboard: 'האירוע הבא',
      view: 'אירועי השבוע',
      primaryAction: 'אירוע חדש',
      tracking: 'תאריך, מיקום, הכנה ותשלום',
    },
    expansionItems: [
      'לידים והזמנות',
      'תאריך ומיקום',
      'מקדמה ותשלום',
      'הכנות לקראת האירוע',
      'סיום ומעקב',
    ],
  },
  appointment: {
    examplesHe: 'טיפול, ייעוץ, שיעורים פרטיים, פגישות אימון.',
    preview: {
      dashboard: 'הפגישה הבאה',
      view: 'סדר יום',
      primaryAction: 'פגישה חדשה',
      tracking: 'שעה, משך, לקוח ותשלום',
    },
    expansionItems: [
      'תאריך ושעה',
      'משך הפגישה',
      'לקוח ומיקום',
      'תשלום וסטטוס',
      'הערות למפגש',
    ],
  },
  journey: {
    examplesHe: 'ליווי עסקי, אימון, טיפול מתמשך, ייעוץ.',
    preview: {
      dashboard: 'תהליכים פעילים',
      view: 'לקוחות בתהליך',
      primaryAction: 'תהליך חדש',
      tracking: 'שלב, התקדמות והפעולה הבאה',
    },
    expansionItems: [
      'שלבים בתהליך',
      'מספר מפגש',
      'הפגישה הבאה',
      'פעולה שדורשת טיפול',
      'מעקב התקדמות',
    ],
  },
  package: {
    examplesHe: 'אימונים, טיפולים, שיעורים, ייעוץ וחבילות שירות.',
    preview: {
      dashboard: 'כרטיסיות פעילות',
      view: 'ניצול ותוקף',
      primaryAction: 'כרטיסייה חדשה',
      tracking: 'מפגשים שנוצלו, יתרה ותוקף',
    },
    expansionItems: [
      'מספר מפגשים',
      'ניצול הכרטיסייה',
      'יתרת מפגשים',
      'תוקף',
      'תשלום',
    ],
  },
  recurring: {
    examplesHe: 'חוגים, קבוצות, קורסים, שיעורים וטיפולים קבועים.',
    preview: {
      dashboard: 'המפגש הבא',
      view: 'השבוע והקבוצות הפעילות',
      primaryAction: 'פעילות קבועה חדשה',
      tracking: 'יום קבוע, משתתפים וגבייה',
    },
    expansionItems: [
      'דפוס חזרה',
      'יום ושעה קבועים',
      'משתתפים',
      'גבייה חוזרת',
      'סטטוס קבוצה',
    ],
  },
  project: {
    examplesHe: 'צילום, מיתוג, עיצוב, הפקה, ייעוץ ופיתוח.',
    preview: {
      dashboard: 'דדליין קרוב',
      view: 'פרויקטים פעילים',
      primaryAction: 'פרויקט חדש',
      tracking: 'שלב, דדליין, אישור ומסירה',
    },
    expansionItems: [
      'שלבים ומשימות',
      'דדליין ומסירה',
      'אישור לקוח',
      'תשלום וערך',
      'פעולה הבאה',
    ],
  },
  hybrid: {
    examplesHe: 'עסק שמשלב אירועים, פגישות, פרויקטים ועוד.',
    preview: {
      dashboard: 'תמונה עסקית משולבת',
      view: 'סינון לפי סוג פעילות',
      primaryAction: 'בחירת סוג פעילות',
      tracking: 'כל מודל לפי הצורך',
    },
    expansionItems: [
      'סוגי פעילות שונים',
      'סינון גמיש',
      'מעקב מותאם לכל סוג',
      'דשבורד משולב',
      'גמישות מלאה',
    ],
  },
};

/** Built-in form fields shown in onboarding preview (not stored as categories) */
export const ONBOARDING_FORM_BUILTIN_FIELDS = [
  { label: 'שם הפעילות', type: 'text' as const },
  { label: 'תאריך', type: 'date' as const },
  { label: 'הערות', type: 'text' as const },
];
