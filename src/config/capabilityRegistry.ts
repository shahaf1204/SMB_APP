import type {
  CapabilityConfigurationRequirement,
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
  configurationRequirement: CapabilityConfigurationRequirement,
  safeToRecommendByDefault = readiness === 'available' || readiness === 'partial',
): CapabilityRegistryEntry {
  return {
    key,
    operatingModel,
    labelHe,
    descriptionHe,
    readiness,
    configurationRequirement,
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
    'none',
  ),
  'event.location': entry(
    'event.location',
    'event',
    'מיקום',
    'מיקום האירוע או ההזמנה.',
    'available',
    'none',
  ),
  'event.payments': entry(
    'event.payments',
    'event',
    'תשלומים ומקדמות',
    'מעקב תשלומים, מקדמות והכנסות לאירוע.',
    'partial',
    'none',
  ),
  'event.confirmation': entry(
    'event.confirmation',
    'event',
    'אישור הזמנה',
    'סטטוס אישור והכנה לפני האירוע.',
    'planned',
    'required',
  ),
  'event.preparation_checklist': entry(
    'event.preparation_checklist',
    'event',
    'רשימת הכנה',
    'משימות הכנה לפני האירוע.',
    'planned',
    'required',
  ),
  'event.suppliers': entry(
    'event.suppliers',
    'event',
    'ספקים',
    'קישור ספקים והוצאות לאירוע.',
    'planned',
    'optional',
  ),
  'event.participants': entry(
    'event.participants',
    'event',
    'משתתפים',
    'מעקב משתתפים או לקוחות באירוע.',
    'planned',
    'optional',
  ),
  'appointment.service_catalog': entry(
    'appointment.service_catalog',
    'appointment',
    'רשימת שירותים',
    'הגדרת סוגי שירות/טיפול עם ברירות מחדל.',
    'planned',
    'required',
  ),
  'appointment.working_hours': entry(
    'appointment.working_hours',
    'appointment',
    'שעות פעילות',
    'ימים ושעות שבהם העסק מקבל תורים.',
    'planned',
    'required',
  ),
  'appointment.default_duration': entry(
    'appointment.default_duration',
    'appointment',
    'משך ברירת מחדל',
    'משך פגישה ברירת מחדל לפי סוג שירות.',
    'planned',
    'optional',
  ),
  'appointment.default_price': entry(
    'appointment.default_price',
    'appointment',
    'מחיר ברירת מחדל',
    'מחיר ברירת מחדל לפגישות.',
    'planned',
    'optional',
  ),
  'appointment.confirmation': entry(
    'appointment.confirmation',
    'appointment',
    'אישור תור',
    'אישור הגעה וסטטוס פגישה.',
    'planned',
    'optional',
  ),
  'appointment.reminders': entry(
    'appointment.reminders',
    'appointment',
    'תזכורות',
    'תזכורות לפגישות קרובות.',
    'partial',
    'optional',
  ),
  'appointment.buffers': entry(
    'appointment.buffers',
    'appointment',
    'מרווחים בין תורים',
    'זמן מנוחה בין פגישות ביומן.',
    'planned',
    'required',
  ),
  'appointment.cancellation': entry(
    'appointment.cancellation',
    'appointment',
    'ביטולים',
    'ניהול ביטולים ושינויי תור.',
    'planned',
    'optional',
  ),
  'appointment.waiting_list': entry(
    'appointment.waiting_list',
    'appointment',
    'רשימת המתנה',
    'רשימת המתנה לתורים שנפתחים.',
    'planned',
    'required',
  ),
  'package.session_limit': entry(
    'package.session_limit',
    'package',
    'מגבלת מפגשים',
    'מעקב מספר מפגשים בכרטיסייה או חבילה.',
    'available',
    'none',
  ),
  'package.expiration': entry(
    'package.expiration',
    'package',
    'תוקף',
    'תאריך תפוגה לכרטיסייה או חבילה.',
    'available',
    'none',
  ),
  'package.renewal': entry(
    'package.renewal',
    'package',
    'חידוש',
    'חידוש כרטיסייה או חבילה.',
    'planned',
    'required',
  ),
  'package.payment_structure': entry(
    'package.payment_structure',
    'package',
    'מבנה תשלום',
    'תשלום מראש או לפי מפגשים בחבילה.',
    'partial',
    'optional',
  ),
  'package.rollover': entry(
    'package.rollover',
    'package',
    'העברת מפגשים',
    'העברת מפגשים שלא נוצלו.',
    'planned',
    'required',
  ),
  'journey.cadence': entry(
    'journey.cadence',
    'journey',
    'קצב תהליך',
    'תדירות מפגשים בתהליך מתמשך.',
    'planned',
    'required',
  ),
  'journey.stages': entry(
    'journey.stages',
    'journey',
    'שלבים',
    'שלבים בתהליך הליווי.',
    'planned',
    'optional',
  ),
  'journey.goals': entry(
    'journey.goals',
    'journey',
    'מטרות',
    'מטרות הלקוח בתהליך.',
    'planned',
    'optional',
  ),
  'journey.planned_end': entry(
    'journey.planned_end',
    'journey',
    'סיום מתוכנן',
    'תאריך סיום צפוי לתהליך.',
    'partial',
    'none',
  ),
  'journey.payment_structure': entry(
    'journey.payment_structure',
    'journey',
    'מבנה תשלום',
    'תשלום לפי שלבים או תהליך.',
    'partial',
    'optional',
  ),
  'project.deadline': entry(
    'project.deadline',
    'project',
    'דדליין',
    'תאריך יעד לפרויקט.',
    'partial',
    'none',
  ),
  'project.milestones': entry(
    'project.milestones',
    'project',
    'אבני דרך',
    'שלבים ואבני דרך בפרויקט.',
    'available',
    'none',
  ),
  'project.payment_milestones': entry(
    'project.payment_milestones',
    'project',
    'תשלומים לפי שלב',
    'תשלומים הקשורים לאבני דרך.',
    'available',
    'none',
  ),
  'project.waiting_on': entry(
    'project.waiting_on',
    'project',
    'ממתין ללקוח',
    'חסימות והמתנה לתגובת לקוח.',
    'planned',
    'optional',
  ),
  'project.deliverables': entry(
    'project.deliverables',
    'project',
    'תוצרים',
    'מעקב תוצרים ומסירה.',
    'planned',
    'optional',
  ),
  'recurring.capacity': entry(
    'recurring.capacity',
    'recurring',
    'קיבולת',
    'מספר משתתפים מקסימלי בחוג או סדרה.',
    'planned',
    'required',
  ),
  'recurring.attendance': entry(
    'recurring.attendance',
    'recurring',
    'נוכחות',
    'רישום נוכחות במפגשים חוזרים.',
    'planned',
    'none',
  ),
  'recurring.waiting_list': entry(
    'recurring.waiting_list',
    'recurring',
    'רשימת המתנה',
    'המתנה למקום בחוג.',
    'planned',
    'required',
  ),
  'recurring.instructor': entry(
    'recurring.instructor',
    'recurring',
    'מדריך/ה',
    'שיוך מדריך או מנחה לסדרה.',
    'planned',
    'optional',
  ),
  'recurring.occurrence_exceptions': entry(
    'recurring.occurrence_exceptions',
    'recurring',
    'חריגות במחזור',
    'ביטול או שינוי מפגש בודד בסדרה.',
    'planned',
    'optional',
  ),
  'recurring.payment_subscription': entry(
    'recurring.payment_subscription',
    'recurring',
    'תשלום חוזר',
    'מנוי או תשלום חודשי לסדרה.',
    'planned',
    'required',
  ),
};

/** Validate registry completeness against Phase 0 key unions. */
export function assertRegistryComplete(): void {
  for (const model of Object.keys(CAPABILITY_KEYS_BY_OPERATING_MODEL) as CapabilityOperatingModel[]) {
    for (const key of CAPABILITY_KEYS_BY_OPERATING_MODEL[model]) {
      if (!CAPABILITY_REGISTRY[key]) {
        throw new Error(`Missing registry entry for ${key}`);
      }
      const regEntry = CAPABILITY_REGISTRY[key];
      if (regEntry.operatingModel !== model) {
        throw new Error(`Registry ownership mismatch for ${key}`);
      }
      if (!regEntry.configurationRequirement) {
        throw new Error(`Missing configurationRequirement for ${key}`);
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
