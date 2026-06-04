import {
  exportEventToPersonalCalendar,
  type CalendarExportOutcome,
} from './calendarExport';
import { loadCalendarSettings } from './calendarSettings';
import { runEventReminderCheck } from './eventReminders';
import type { Event } from '../types/models';

/** אחרי שמירת אירוע — יומן + תזכורות */
export async function afterEventSaved(
  event: Event,
  allEvents: Event[],
): Promise<CalendarExportOutcome | null> {
  const settings = loadCalendarSettings();
  if (!settings.syncToCalendar) {
    await runEventReminderCheck(allEvents);
    return null;
  }

  const outcome = exportEventToPersonalCalendar(event, settings);
  await runEventReminderCheck(allEvents);
  return outcome.message || outcome.googleCalendarUrl ? outcome : null;
}
