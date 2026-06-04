import type { Event } from '../types/models';

export interface EventDraft {
  title: string;
  eventDate: string;
  location?: string;
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** אזהרות לפני שמירת אירוע — כפילות או אירועים באותו יום */
export function getEventSaveWarnings(
  events: Event[],
  draft: EventDraft,
  excludeEventId?: string,
): string[] {
  const warnings: string[] = [];
  if (!draft.title.trim() || !draft.eventDate) return warnings;

  const others = events.filter((e) => e.id !== excludeEventId);
  const normTitle = normalizeTitle(draft.title);
  const loc = (draft.location ?? '').trim().toLowerCase();

  const exactDuplicates = others.filter(
    (e) =>
      e.eventDate === draft.eventDate &&
      normalizeTitle(e.title) === normTitle &&
      (e.location.trim().toLowerCase() || '') === loc,
  );

  if (exactDuplicates.length > 0) {
    warnings.push(
      `נראה שכבר קיים אירוע דומה: «${exactDuplicates[0].title}» בתאריך ${draft.eventDate}${exactDuplicates[0].location ? ` (${exactDuplicates[0].location})` : ''}.`,
    );
  }

  const sameDay = others.filter((e) => e.eventDate === draft.eventDate);
  const sameDayOther = sameDay.filter(
    (e) => normalizeTitle(e.title) !== normTitle || (e.location.trim().toLowerCase() || '') !== loc,
  );

  if (sameDayOther.length > 0 && exactDuplicates.length === 0) {
    const list = sameDayOther
      .slice(0, 4)
      .map((e) => `«${e.title}»`)
      .join(', ');
    const more = sameDayOther.length > 4 ? ` ועוד ${sameDayOther.length - 4}` : '';
    warnings.push(`בתאריך ${draft.eventDate} כבר רשום/ים אירוע/ים: ${list}${more}.`);
  }

  return warnings;
}

export function confirmEventSaveDespiteWarnings(warnings: string[]): boolean {
  if (warnings.length === 0) return true;
  return window.confirm(
    `${warnings.join('\n\n')}\n\nלהמשיך ולשמור בכל זאת?`,
  );
}
