import { useMemo } from 'react';
import { findNextEvent } from '../../lib/events';
import { useAppStore } from '../../store/useAppStore';

function formatHeroDate(): string {
  const now = new Date();
  return now.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'בוקר טוב';
  if (hour < 17) return 'צהריים טובים';
  if (hour < 21) return 'ערב טוב';
  return 'לילה טוב';
}

function buildContextLine(events: ReturnType<typeof useAppStore.getState>['events']): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekCount = events.filter((e) => {
    const d = new Date(e.eventDate);
    d.setHours(0, 0, 0, 0);
    return d >= today && d <= weekEnd;
  }).length;

  if (weekCount > 0) {
    return weekCount === 1
      ? 'יש לך אירוע אחד השבוע 🎈'
      : `יש לך ${weekCount} אירועים השבוע 🎈`;
  }

  const next = findNextEvent(events);
  if (!next) return 'אין אירועים קרובים — זמן לתכנן';

  const eventDay = new Date(next.eventDate);
  eventDay.setHours(0, 0, 0, 0);
  const days = Math.round((eventDay.getTime() - today.getTime()) / 86_400_000);

  if (days === 0) return 'האירוע הבא שלך היום';
  if (days === 1) return 'האירוע הבא שלך מחר';
  return `האירוע הבא שלך בעוד ${days} ימים`;
}

export function DashboardHero() {
  const user = useAppStore((s) => s.user)!;
  const events = useAppStore((s) => s.events);

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const dateLine = useMemo(() => formatHeroDate(), []);
  const contextLine = useMemo(() => buildContextLine(events), [events]);

  return (
    <header className="dash-v2-hero" aria-label="ברוכים הבאים">
      <p className="dash-v2-hero-greeting">{greeting}</p>
      <h1 className="dash-v2-hero-name">{user.displayName}</h1>
      <p className="dash-v2-hero-subtitle">
        <span className="dash-v2-hero-subtitle-date">{dateLine}</span>
        <span className="dash-v2-hero-subtitle-sep" aria-hidden>
          ·
        </span>
        <span>{contextLine}</span>
      </p>
    </header>
  );
}
