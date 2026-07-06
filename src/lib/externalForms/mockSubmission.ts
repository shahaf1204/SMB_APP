/** Realistic birthday-party payload for Forms.app simulate / test */

function nextSaturdayIso(from = new Date()): string {
  const d = new Date(from);
  const day = d.getDay();
  const daysUntil = day === 6 ? 7 : (6 - day + 7) % 7;
  d.setDate(d.getDate() + (daysUntil === 0 ? 7 : daysUntil));
  return d.toISOString().slice(0, 10);
}

export function buildFormsAppMockPayload(): Record<string, string> {
  const eventDate = nextSaturdayIso();
  return {
    'שם ההורה': 'Shira Cohen',
    'Parent Name': 'Shira Cohen',
    'טלפון': '0501234567',
    Phone: '0501234567',
    'שם הילד/ה': 'Noa',
    'Child Name': 'Noa',
    'תאריך האירוע': eventDate,
    'Event Date': eventDate,
    'שעת האירוע': '17:00',
    'Event Time': '17:00',
    'מיקום האירוע': 'Raanana',
    Location: 'Raanana',
    'הערות': 'Princess birthday',
    Notes: 'Princess birthday',
    submission_id: `mock_${Date.now()}`,
  };
}
