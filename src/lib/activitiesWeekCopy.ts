/** Friendly copy for the this-week events showcase on Activities. */
export function weekEventsCopy(
  count: number,
  options: { hasToday: boolean; hasTomorrow: boolean },
): { title: string; subtitle: string } {
  if (count === 0) {
    return { title: '', subtitle: '' };
  }

  if (options.hasToday && count === 1) {
    return {
      title: 'היום יש לך אירוע',
      subtitle: 'יום מלא אנרגיה — בהצלחה! את/ה מוכן/ה?',
    };
  }

  if (options.hasToday) {
    return {
      title: `${count} אירועים השבוע`,
      subtitle: 'כולל אירוע היום — שיהיה שבוע מדהים',
    };
  }

  if (options.hasTomorrow && count === 1) {
    return {
      title: 'מחר מתחילים',
      subtitle: 'אירוע אחד בפתח — זמן מצוין להתארגן',
    };
  }

  if (count === 1) {
    return {
      title: 'אירוע אחד השבוע',
      subtitle: 'שבוע רגוע עם מיקוד על מה שחשוב ✨',
    };
  }

  if (count === 2) {
    return {
      title: 'שני אירועים השבוע',
      subtitle: 'קצב נעים — בדיוק כמו שצריך',
    };
  }

  if (count <= 4) {
    return {
      title: `${count} אירועים השבוע`,
      subtitle: 'שבוע פעיל ומלא — העסק שלך זז יפה',
    };
  }

  return {
    title: `${count} אירועים השבוע`,
    subtitle: 'וואו, שבוע עמוס! את/ה עושה עבודה מעולה 🎉',
  };
}

export function relativeDayLabel(isoDate: string, todayIso: string): string {
  if (isoDate === todayIso) return 'היום';

  const today = new Date(`${todayIso}T12:00:00`);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);
  if (isoDate === tomorrowIso) return 'מחר';

  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('he-IL', { weekday: 'long' });
}
