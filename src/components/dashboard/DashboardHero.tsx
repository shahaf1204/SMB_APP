import { CalendarDays, FileText, ListTodo } from 'lucide-react';
import { useMemo } from 'react';
import { buildDailySummary } from '../../lib/dailySummary';
import { useAppStore } from '../../store/useAppStore';

const BULLET_ICONS = [CalendarDays, ListTodo, FileText] as const;

function formatTodayDate(): { weekday: string; full: string } {
  const now = new Date();
  const weekday = now.toLocaleDateString('he-IL', { weekday: 'long' });
  const full = now.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return { weekday, full };
}

export function DashboardHero() {
  const user = useAppStore((s) => s.user)!;
  const events = useAppStore((s) => s.events);
  const leads = useAppStore((s) => s.leads);
  const invoices = useAppStore((s) => s.invoices);
  const tasks = useAppStore((s) => s.tasks);
  const dismissedAutoTasks = useAppStore((s) => s.dismissedAutoTasks);

  const summary = useMemo(
    () =>
      buildDailySummary(
        user.displayName,
        events,
        leads,
        invoices,
        tasks,
        dismissedAutoTasks,
      ),
    [user.displayName, events, leads, invoices, tasks, dismissedAutoTasks],
  );

  const date = useMemo(() => formatTodayDate(), []);

  return (
    <header className="dash-v2-hero" aria-label="ברוכים הבאים">
      <div className="dash-v2-hero-top">
        <div>
          <p className="dash-v2-hero-greeting">{summary.greeting}</p>
          <h1 className="dash-v2-hero-name">{summary.userName}</h1>
        </div>
        <div className="dash-v2-hero-date">
          <span className="dash-v2-hero-date-day">{date.weekday}</span>
          <span className="dash-v2-hero-date-full">{date.full}</span>
        </div>
      </div>
      <ul className="dash-v2-hero-summary">
        {summary.bullets.map((b, i) => {
          const Icon = BULLET_ICONS[i % BULLET_ICONS.length];
          return (
            <li key={b} className="dash-v2-hero-pill">
              <span className="dash-v2-hero-pill-icon" aria-hidden>
                <Icon size={16} strokeWidth={2} />
              </span>
              {b}
            </li>
          );
        })}
      </ul>
    </header>
  );
}
