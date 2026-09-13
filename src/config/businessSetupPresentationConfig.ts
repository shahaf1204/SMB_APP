import type { CapabilityKey } from '../types/businessArchitecture';
import type { OperatingModel } from '../types/workspace';
import type { RecommendableOperatingModel } from './businessTypeRecommendationConfig';

/** User-facing labels — never expose raw capability keys in UI. */
export const BUSINESS_SETUP_FEATURE_LABELS_HE: Record<CapabilityKey, string> = {
  'event.time': 'תאריך ושעה',
  'event.location': 'מיקום',
  'event.payments': 'מעקב תשלומים',
  'event.confirmation': 'אישור הזמנה',
  'event.preparation_checklist': 'רשימת הכנה',
  'event.suppliers': 'ספקים',
  'event.participants': 'משתתפים',
  'appointment.service_catalog': 'סוגי שירות',
  'appointment.working_hours': 'שעות פעילות',
  'appointment.default_duration': 'משך ברירת מחדל',
  'appointment.default_price': 'מחיר ברירת מחדל',
  'appointment.confirmation': 'אישור תור',
  'appointment.reminders': 'תזכורות לפגישות',
  'appointment.buffers': 'מרווחים בין תורים',
  'appointment.cancellation': 'ניהול ביטולים',
  'appointment.waiting_list': 'רשימת המתנה',
  'package.session_limit': 'מעקב ניצול חבילה',
  'package.expiration': 'תוקף חבילה',
  'package.renewal': 'חידוש חבילה',
  'package.payment_structure': 'מבנה תשלום לחבילה',
  'package.rollover': 'העברת מפגשים',
  'journey.cadence': 'קצב תהליך',
  'journey.stages': 'שלבים בתהליך',
  'journey.goals': 'מטרות לקוח',
  'journey.planned_end': 'סיום מתוכנן',
  'journey.payment_structure': 'מבנה תשלום בתהליך',
  'project.deadline': 'דדליין לפרויקט',
  'project.milestones': 'אבני דרך',
  'project.payment_milestones': 'תשלומים לפי אבני דרך',
  'project.waiting_on': 'ממתין ללקוח',
  'project.deliverables': 'תוצרים',
  'recurring.capacity': 'קיבולת בחוג',
  'recurring.attendance': 'רישום נוכחות',
  'recurring.waiting_list': 'רשימת המתנה לחוג',
  'recurring.instructor': 'שיוך מדריך',
  'recurring.occurrence_exceptions': 'שינויים במחזור',
  'recurring.payment_subscription': 'תשלום חוזר',
};

const ADDITIONAL_SUPPORT_PHRASES: Partial<Record<RecommendableOperatingModel, string>> = {
  package: 'ובנוסף תוכלי לעקוב אחרי חבילות וכרטיסיות',
  project: 'ובנוסף תוכלי לנהל פרויקטים מתמשכים',
  appointment: 'ובנוסף תוכלי לנהל גם פגישות לפי יומן',
  event: 'ובנוסף תוכלי לנהל גם עבודות לפי תאריך',
  journey: 'ובנוסף תוכלי ללוות תהליכים מתמשכים',
  recurring: 'ובנוסף תוכלי לנהל פעילות קבועה וחוזרת',
};

const PRIMARY_EMPHASIS_BY_PRESET: Record<string, Partial<Record<RecommendableOperatingModel, string>>> = {
  beauty: {
    appointment: 'תורים וטיפולים יהיו במרכז העבודה שלך.',
  },
  tutor: {
    appointment: 'שיעורים ופגישות יהיו הפעילות המרכזית שלך.',
  },
  photographer: {
    event: 'אירועים יהיו במרכז, ובנוסף תוכלי לנהל פרויקטים מתמשכים.',
  },
  therapist: {
    journey: 'ליווי מתמשך יהיה במרכז העבודה שלך.',
  },
  coach: {
    journey: 'ליווי מתמשך יהיה במרכז העבודה שלך.',
    appointment: 'פגישות ואימונים יהיו במרכז העבודה שלך.',
  },
  consultant: {
    journey: 'ליווי ייעוצי מתמשך יהיה במרכז העבודה שלך.',
    project: 'פרויקטים עם שלבים ותוצרים יהיו במרכז העבודה שלך.',
  },
  studio: {
    recurring: 'חוגים ומפגשים קבועים יהיו במרכז העבודה שלך.',
  },
  design: {
    event: 'עבודות לפי תאריך ואירועים יהיו במרכז העבודה שלך.',
  },
  freelance: {
    project: 'פרויקטים ועבודות עם תוצר מוגדר יהיו במרכז העבודה שלך.',
    appointment: 'פגישות ושירותים לפי יומן יהיו במרכז העבודה שלך.',
  },
  birthday: {
    event: 'אירועים ועבודות לפי תאריך יהיו במרכז העבודה שלך.',
  },
  confectioner: {
    event: 'הזמנות ועבודות לפי תאריך אספקה יהיו במרכז העבודה שלך.',
  },
  balloons: {
    event: 'עבודות ואירועים לפי תאריך יהיו במרכז העבודה שלך.',
  },
};

const GENERIC_PRIMARY_EMPHASIS: Record<RecommendableOperatingModel, string> = {
  event: 'עבודות ואירועים לפי תאריך יהיו במרכז העבודה שלך.',
  appointment: 'פגישות ותורים לפי יומן יהיו במרכז העבודה שלך.',
  package: 'חבילות וכרטיסיות יהיו במרכז העבודה שלך.',
  journey: 'ליווי ותהליכים מתמשכים יהיו במרכז העבודה שלך.',
  project: 'פרויקטים עם שלבים ודדליין יהיו במרכז העבודה שלך.',
  recurring: 'פעילות קבועה וחוזרת תהיה במרכז העבודה שלך.',
};

export const AUTOMATION_SETUP_HEADLINE_HE = 'הכנו לך סביבת עבודה שמתאימה לעסק שלך';

export const AUTOMATION_SETUP_FIELDS_BRIDGE_HE =
  'בשלב הבא תראי איך ייראה הטופס שלך — אפשר לשנות בכל שלב.';

export const AUTOMATION_SETUP_ADJUST_PROMPT_HE = 'העסק שלי עובד קצת אחרת';

export interface BusinessSetupSummaryInput {
  businessTypePresetId?: string;
  primaryOperatingModel: OperatingModel;
  additionalOperatingModels: OperatingModel[];
}

export function resolveBusinessSetupWorkspaceSummary(
  input: BusinessSetupSummaryInput,
): { headlineHe: string; bodyHe: string } {
  const primary = input.primaryOperatingModel;
  const additional = input.additionalOperatingModels.filter(
    (m) => m !== primary && m !== 'hybrid',
  ) as RecommendableOperatingModel[];

  let bodyHe: string | undefined;

  if (input.businessTypePresetId && primary !== 'hybrid') {
    bodyHe = PRIMARY_EMPHASIS_BY_PRESET[input.businessTypePresetId]?.[primary];
  }

  if (!bodyHe && primary !== 'hybrid') {
    bodyHe = GENERIC_PRIMARY_EMPHASIS[primary];
  }

  if (!bodyHe) {
    bodyHe = 'התאמנו את סביבת העבודה לפי צורת העבודה שבחרת.';
  }

  if (additional.length > 0 && primary !== 'hybrid') {
    const presetPrimary = input.businessTypePresetId
      ? PRIMARY_EMPHASIS_BY_PRESET[input.businessTypePresetId]?.[primary]
      : undefined;
    const includesSupportInPreset =
      presetPrimary?.includes('בנוסף') ?? false;

    if (!includesSupportInPreset) {
      const supportPhrase = additional
        .map((m) => ADDITIONAL_SUPPORT_PHRASES[m])
        .filter(Boolean)
        .join(' ');
      if (supportPhrase) {
        bodyHe = `${bodyHe.replace(/\.$/, '')}, ${supportPhrase}.`;
      }
    }
  }

  return {
    headlineHe: AUTOMATION_SETUP_HEADLINE_HE,
    bodyHe,
  };
}

/** Natural-language highlights of what the product prepared — no capability jargon. */
const PREPARED_HIGHLIGHTS_BY_PRIMARY: Record<
  RecommendableOperatingModel,
  string
> = {
  event:
    'אירוע יהיה הפעילות המרכזית שלך, וכבר הגדרנו מעקב אחר תאריך, לקוח, מיקום ותשלום.',
  appointment:
    'תורים ופגישות יהיו במרכז העבודה שלך, עם מעקב אחר לקוח, תאריך ותשלום.',
  package:
    'חבילות וכרטיסיות יהיו במרכז, עם מעקב אחר ניצול, תוקף ויתרת מפגשים.',
  journey:
    'תהליכי ליווי יהיו במרכז, עם מעקב אחר שלבים, מפגשים והתקדמות.',
  project:
    'פרויקטים יהיו במרכז, עם מעקב אחר שלבים, דדליין ותשלומים.',
  recurring:
    'פעילות קבועה תהיה במרכז, עם מעקב אחר מפגשים, משתתפים וגבייה.',
};

export function resolvePreparedWorkspaceHighlights(
  input: BusinessSetupSummaryInput,
): string[] {
  const primary = input.primaryOperatingModel;
  if (primary === 'hybrid') {
    return ['הכנו סביבת עבודה שמתאימה לצורת העבודה שבחרת.'];
  }

  const highlights: string[] = [];
  const presetBody =
    input.businessTypePresetId &&
    PRIMARY_EMPHASIS_BY_PRESET[input.businessTypePresetId]?.[primary];
  if (presetBody) {
    highlights.push(presetBody);
  }

  highlights.push(PREPARED_HIGHLIGHTS_BY_PRIMARY[primary]);

  return highlights;
}

export function getBusinessSetupFeatureLabelHe(key: CapabilityKey): string {
  return BUSINESS_SETUP_FEATURE_LABELS_HE[key];
}

/** Minimum exposable features before showing a detailed feature list prominently. */
export const BUSINESS_SETUP_FEATURE_LIST_THRESHOLD = 2;

/** @deprecated Use AUTOMATION_SETUP_FIELDS_BRIDGE_HE */
export const BUSINESS_SETUP_FIELDS_BRIDGE_HE = AUTOMATION_SETUP_FIELDS_BRIDGE_HE;

export const BUSINESS_SETUP_LOW_FEATURE_COPY_HE =
  'הכנו את סביבת העבודה לפי איך שהעסק שלך עובד — נמשיך לתצוגת הטופס.';
