import type {
  CapabilityKey,
  CapabilityOperatingModel,
  CapabilityReadiness,
  CapabilityRegistryEntry,
} from '../types/businessArchitecture';
import { CAPABILITY_KEYS_BY_OPERATING_MODEL } from '../types/businessArchitecture';

function entry(
  key: CapabilityKey,
  operatingModel: CapabilityOperatingModel,
  labelHe: string,
  descriptionHe: string,
  readiness: CapabilityReadiness,
  safeToRecommendByDefault = readiness === 'available' || readiness === 'partial',
): CapabilityRegistryEntry {
  return {
    key,
    operatingModel,
    labelHe,
    descriptionHe,
    readiness,
    safeToRecommendByDefault,
  };
}

/** Central capability registry — one entry per Phase 0 capability key. */
export const CAPABILITY_REGISTRY: Record<CapabilityKey, CapabilityRegistryEntry> = {
  'event.time': entry(
    'event.time',
    'event',
    'תאריך ושעת אירוע',
    'ניהול מועד האירוע או העבודה לפי תאריך.',
    'available',
  ),
  'event.location': entry(
    'event.location',
    'event',
    'מיקום',
    'מיקום האירוע או ההזמנה.',
    'available',
  ),
  'event.payments': entry(
    'event.payments',
    'event',
    'תשלומים ומקדמות',
    'מעקב תשלומים, מקדמות והכנסות לאירוע.',
    'partial',
  ),
  'event.confirmation': entry(
    'event.confirmation',
    'event',
    'אישור הזמנה',
    'סטטוס אישור והכנה לפני האירוע.',
    'planned',
  ),
  'event.preparation_checklist': entry(
    'event.preparation_checklist',
    'event',
    'רשימת הכנה',
    'משימות הכנה לפני האירוע.',
    'planned',
  ),
  'event.suppliers': entry(
    'event.suppliers',
    'event',
    'ספקים',
    'קישור ספקים והוצאות לאירוע.',
    'planned',
  ),
  'event.participants': entry(
    'event.participants',
    'event',
    'משתתפים',
    'מעקב משתתפים או לקוחות באירוע.',
    'planned',
  ),
  'appointment.service_catalog': entry(
    'appointment.service_catalog',
    'appointment',
    'רשימת שירותים',
    'הגדרת סוגי שירות/טיפול עם ברירות מחדל.',
    'planned',
  ),
  'appointment.working_hours': entry(
    'appointment.working_hours',
    'appointment',
    'שעות פעילות',
    'ימים ושעות שבהם העסק מקבל תורים.',
    'planned',
  ),
  'appointment.default_duration': entry(
    'appointment.default_duration',
    'appointment',
    'משך ברירת מחדל',
    'משך פגישה ברירת מחדל לפי סוג שירות.',
    'planned',
  ),
  'appointment.default_price': entry(
    'appointment.default_price',
    'appointment',
    'מחיר ברירת מחדל',
    'מחיר ברירת מחדל לפגישות.',
    'planned',
  ),
  'appointment.confirmation': entry(
    'appointment.confirmation',
    'appointment',
    'אישור תור',
    'אישור הגעה וסטטוס פגישה.',
    'planned',
  ),
  'appointment.reminders': entry(
    'appointment.reminders',
    'appointment',
    'תזכורות',
    'תזכורות לפגישות קרובות.',
    'partial',
  ),
  'appointment.buffers': entry(
    'appointment.buffers',
    'appointment',
    'מרווחים בין תורים',
    'זמן מנוחה בין פגישות ביומן.',
    'planned',
  ),
  'appointment.cancellation': entry(
    'appointment.cancellation',
    'appointment',
    'ביטולים',
    'ניהול ביטולים ושינויי תור.',
    'planned',
  ),
  'appointment.waiting_list': entry(
    'appointment.waiting_list',
    'appointment',
    'רשימת המתנה',
    'רשימת המתנה לתורים שנפתחים.',
    'planned',
  ),
  'package.session_limit': entry(
    'package.session_limit',
    'package',
    'מגבלת מפגשים',
    'מעקב מספר מפגשים בכרטיסייה או חבילה.',
    'available',
  ),
  'package.expiration': entry(
    'package.expiration',
    'package',
    'תוקף',
    'תאריך תפוגה לכרטיסייה או חבילה.',
    'available',
  ),
  'package.renewal': entry(
    'package.renewal',
    'package',
    'חידוש',
    'חידוש כרטיסייה או חבילה.',
    'planned',
  ),
  'package.payment_structure': entry(
    'package.payment_structure',
    'package',
    'מבנה תשלום',
    'תשלום מראש או לפי מפגשים בחבילה.',
    'partial',
  ),
  'package.rollover': entry(
    'package.rollover',
    'package',
    'העברת מפגשים',
    'העברת מפגשים שלא נוצלו.',
    'planned',
  ),
  'journey.cadence': entry(
    'journey.cadence',
    'journey',
    'קצב תהליך',
    'תדירות מפגשים בתהליך מתמשך.',
    'planned',
  ),
  'journey.stages': entry(
    'journey.stages',
    'journey',
    'שלבים',
    'שלבים בתהליך הליווי.',
    'planned',
  ),
  'journey.goals': entry(
    'journey.goals',
    'journey',
    'מטרות',
    'מטרות הלקוח בתהליך.',
    'planned',
  ),
  'journey.planned_end': entry(
    'journey.planned_end',
    'journey',
    'סיום מתוכנן',
    'תאריך סיום צפוי לתהליך.',
    'partial',
  ),
  'journey.payment_structure': entry(
    'journey.payment_structure',
    'journey',
    'מבנה תשלום',
    'תשלום לפי שלבים או תהליך.',
    'partial',
  ),
  'project.deadline': entry(
    'project.deadline',
    'project',
    'דדליין',
    'תאריך יעד לפרויקט.',
    'partial',
  ),
  'project.milestones': entry(
    'project.milestones',
    'project',
    'אבני דרך',
    'שלבים ואבני דרך בפרויקט.',
    'available',
  ),
  'project.payment_milestones': entry(
    'project.payment_milestones',
    'project',
    'תשלומים לפי שלב',
    'תשלומים הקשורים לאבני דרך.',
    'available',
  ),
  'project.waiting_on': entry(
    'project.waiting_on',
    'project',
    'ממתין ללקוח',
    'חסימות והמתנה לתגובת לקוח.',
    'planned',
  ),
  'project.deliverables': entry(
    'project.deliverables',
    'project',
    'תוצרים',
    'מעקב תוצרים ומסירה.',
    'planned',
  ),
  'recurring.capacity': entry(
    'recurring.capacity',
    'recurring',
    'קיבולת',
    'מספר משתתפים מקסימלי בחוג או סדרה.',
    'planned',
  ),
  'recurring.attendance': entry(
    'recurring.attendance',
    'recurring',
    'נוכחות',
    'רישום נוכחות במפגשים חוזרים.',
    'planned',
  ),
  'recurring.waiting_list': entry(
    'recurring.waiting_list',
    'recurring',
    'רשימת המתנה',
    'המתנה למקום בחוג.',
    'planned',
  ),
  'recurring.instructor': entry(
    'recurring.instructor',
    'recurring',
    'מדריך/ה',
    'שיוך מדריך או מנחה לסדרה.',
    'planned',
  ),
  'recurring.occurrence_exceptions': entry(
    'recurring.occurrence_exceptions',
    'recurring',
    'חריגות במחזור',
    'ביטול או שינוי מפגש בודד בסדרה.',
    'planned',
  ),
  'recurring.payment_subscription': entry(
    'recurring.payment_subscription',
    'recurring',
    'תשלום חוזר',
    'מנוי או תשלום חודשי לסדרה.',
    'planned',
  ),
};

/** Validate registry completeness against Phase 0 key unions. */
export function assertRegistryComplete(): void {
  for (const model of Object.keys(CAPABILITY_KEYS_BY_OPERATING_MODEL) as CapabilityOperatingModel[]) {
    for (const key of CAPABILITY_KEYS_BY_OPERATING_MODEL[model]) {
      if (!CAPABILITY_REGISTRY[key]) {
        throw new Error(`Missing registry entry for ${key}`);
      }
      if (CAPABILITY_REGISTRY[key].operatingModel !== model) {
        throw new Error(`Registry ownership mismatch for ${key}`);
      }
    }
  }
}

export function getCapabilityEntry(key: CapabilityKey): CapabilityRegistryEntry {
  return CAPABILITY_REGISTRY[key];
}

export function getCapabilitiesForOperatingModel(
  model: CapabilityOperatingModel,
): CapabilityRegistryEntry[] {
  return CAPABILITY_KEYS_BY_OPERATING_MODEL[model].map((key) => CAPABILITY_REGISTRY[key]);
}

export function isHybridCapabilityModel(_model: string): boolean {
  return _model === 'hybrid';
}
