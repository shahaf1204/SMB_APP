import { CalendarDays, FileText, ListTodo } from 'lucide-react';
import { useMemo } from 'react';
import { buildDailySummary } from '../lib/dailySummary';
import { useAppStore } from '../store/useAppStore';

const BULLET_ICONS = [CalendarDays, ListTodo, FileText] as const;

export function PageHeader() {
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

  return (
    <header className="dash-welcome" aria-label="סיכום יומי">
      <p className="dash-welcome-greeting">{summary.greeting}</p>
      <h1 className="dash-welcome-name">{summary.userName}</h1>
      <ul className="dash-welcome-pills">
        {summary.bullets.map((b, i) => {
          const Icon = BULLET_ICONS[i % BULLET_ICONS.length];
          return (
            <li key={b} className="dash-welcome-pill">
              <span className="dash-welcome-pill-icon" aria-hidden>
                <Icon size={14} strokeWidth={2.2} />
              </span>
              {b}
            </li>
          );
        })}
      </ul>
    </header>
  );
}
