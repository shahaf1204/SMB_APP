import { loadCalendarSettings, remindersEnabled } from './calendarSettings';
import type { Event } from '../types/models';

const NOTIFIED_KEY = 'smb-event-notified';

type NotifiedMap = Record<string, true>;

function loadNotified(): NotifiedMap {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '{}') as NotifiedMap;
  } catch {
    return {};
  }
}

function saveNotified(map: NotifiedMap): void {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function notifyKey(eventId: string, kind: 'dayBefore' | 'sameDay', date: string): string {
  return `${eventId}:${kind}:${date}`;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function showNotification(title: string, body: string, tag: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag, lang: 'he' });
  } catch {
    /* ignore — iOS / restricted contexts */
  }
}

/** בודק אירועים ומציג תזכורות מקומיות (כשפותחים את האפליקציה) */
export async function runEventReminderCheck(events: Event[]): Promise<void> {
  const settings = loadCalendarSettings();
  if (!remindersEnabled(settings)) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const today = todayIso();
  const tomorrow = tomorrowIso();
  const notified = loadNotified();
  let changed = false;

  const upcoming = events.filter((e) => e.eventDate >= today);

  for (const event of upcoming) {
    if (
      (settings.reminders === 'dayBefore' || settings.reminders === 'both') &&
      event.eventDate === tomorrow
    ) {
      const key = notifyKey(event.id, 'dayBefore', tomorrow);
      if (!notified[key]) {
        showNotification(
          'אירוע מחר',
          `${event.title}${event.location ? ` · ${event.location}` : ''}`,
          key,
        );
        notified[key] = true;
        changed = true;
      }
    }

    if (
      (settings.reminders === 'sameDay' || settings.reminders === 'both') &&
      event.eventDate === today
    ) {
      const key = notifyKey(event.id, 'sameDay', today);
      if (!notified[key]) {
        showNotification(
          'אירוע היום',
          `${event.title}${event.location ? ` · ${event.location}` : ''}`,
          key,
        );
        notified[key] = true;
        changed = true;
      }
    }
  }

  if (changed) saveNotified(notified);
}
