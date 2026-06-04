export function eventStatus(eventDate: string): 'past' | 'today' | 'future' {
  const d = new Date(eventDate);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const t = d.getTime();
  const n = now.getTime();
  if (t < n) return 'past';
  if (t > n) return 'future';
  return 'today';
}
