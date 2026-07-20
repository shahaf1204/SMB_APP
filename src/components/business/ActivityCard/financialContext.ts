import type { ActivityPresentationType } from './types';

/** Presentation-specific amount label — internal, not a public prop */
export function amountContextLabelFor(
  presentationType: ActivityPresentationType,
): string {
  const labels: Record<ActivityPresentationType, string> = {
    event: 'הכנסה צפויה',
    appointment: 'מחיר הפגישה',
    journey: 'ערך התהליך',
    package: 'מחיר החבילה',
    project: 'ערך הפרויקט',
    recurring: 'ערך הפעילות',
    generic: 'ערך הפעילות',
  };
  return labels[presentationType];
}
