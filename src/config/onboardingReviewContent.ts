import type { OperatingModel } from '../types/workspace';

export interface OnboardingReviewValueContent {
  readyTitleHe: string;
  readySubtitleHe: string;
  valueBulletsHe: string[];
  primaryActionLabelHe: string;
}

const MODEL_REVIEW_CONTENT: Record<OperatingModel, OnboardingReviewValueContent> = {
  event: {
    readyTitleHe: 'העסק שלך מוכן ✓',
    readySubtitleHe: 'סביבת העבודה הותאמה לניהול אירועים ועבודות לפי תאריך.',
    valueBulletsHe: [
      'הוספת אירוע בכמה שניות',
      'מעקב אחרי תשלומים ומקדמות',
      'לראות מה האירוע הבא',
      'לזהות דברים שדורשים טיפול',
    ],
    primaryActionLabelHe: 'הוספת אירוע ראשון',
  },
  appointment: {
    readyTitleHe: 'העסק שלך מוכן ✓',
    readySubtitleHe: 'סביבת העבודה הותאמה לניהול תורים ופגישות.',
    valueBulletsHe: [
      'הוספת פגישה בכמה שניות',
      'מעקב אחרי לקוחות ותשלומים',
      'לראות מה הפגישה הבאה',
      'לזהות דברים שדורשים טיפול',
    ],
    primaryActionLabelHe: 'הוספת פגישה ראשונה',
  },
  package: {
    readyTitleHe: 'העסק שלך מוכן ✓',
    readySubtitleHe: 'סביבת העבודה הותאמה לניהול חבילות וכרטיסיות.',
    valueBulletsHe: [
      'מעקב אחרי ניצול חבילות',
      'תוקף ויתרת מפגשים',
      'לראות מה דורש חידוש',
      'לזהות דברים שדורשים טיפול',
    ],
    primaryActionLabelHe: 'הוספת חבילה ראשונה',
  },
  journey: {
    readyTitleHe: 'העסק שלך מוכן ✓',
    readySubtitleHe: 'סביבת העבודה הותאמה לליווי מתמשך של לקוחות.',
    valueBulletsHe: [
      'מעקב אחרי שלבים בתהליך',
      'לראות מה הפגישה הבאה',
      'לזהות פעולות שדורשות טיפול',
      'לעקוב אחרי התקדמות הלקוח',
    ],
    primaryActionLabelHe: 'פתיחת תהליך ראשון',
  },
  project: {
    readyTitleHe: 'העסק שלך מוכן ✓',
    readySubtitleHe: 'סביבת העבודה הותאמה לניהול פרויקטים עם שלבים ודדליין.',
    valueBulletsHe: [
      'אבני דרך ומועדי יעד',
      'מעקב אחרי תשלומים',
      'לראות מה הדדליין הקרוב',
      'לזהות דברים שדורשים טיפול',
    ],
    primaryActionLabelHe: 'פתיחת פרויקט ראשון',
  },
  recurring: {
    readyTitleHe: 'העסק שלך מוכן ✓',
    readySubtitleHe: 'סביבת העבודה הותאמה לפעילות קבועה וחוזרת.',
    valueBulletsHe: [
      'מעקב אחרי מפגשים קבועים',
      'ניהול משתתפים וגבייה',
      'לראות מה המפגש הבא',
      'לזהות דברים שדורשים טיפול',
    ],
    primaryActionLabelHe: 'הוספת פעילות קבועה ראשונה',
  },
  hybrid: {
    readyTitleHe: 'העסק שלך מוכן ✓',
    readySubtitleHe: 'סביבת העבודה הותאמה לעסק שמשלב כמה צורות עבודה.',
    valueBulletsHe: [
      'ניהול סוגי פעילות שונים',
      'מעקב מותאם לכל סוג עבודה',
      'לראות מה דורש טיפול',
      'להתחיל לעבוד מיד',
    ],
    primaryActionLabelHe: 'כניסה לעסק שלי',
  },
};

export function resolveOnboardingReviewContent(
  primaryModel: OperatingModel,
): OnboardingReviewValueContent {
  return MODEL_REVIEW_CONTENT[primaryModel];
}
