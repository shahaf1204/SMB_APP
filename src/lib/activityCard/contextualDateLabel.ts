/**
 * Generic Hebrew contextual label from an ISO date (YYYY-MM-DD).
 * Date-only — no business-specific assumptions.
 */
export function contextualDateLabel(
  isoDate: string,
  referenceDate: Date = new Date(),
): string | null {
  if (!isoDate) return null;

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return 'היום';
  if (diffDays === 1) return 'מחר';
  if (diffDays === -1) return 'אתמול';
  if (diffDays > 1 && diffDays <= 14) return `בעוד ${diffDays} ימים`;
  if (diffDays < -1) return `באיחור של ${Math.abs(diffDays)} ימים`;
  if (diffDays > 14 && diffDays <= 21) return 'השבוע';

  return null;
}
