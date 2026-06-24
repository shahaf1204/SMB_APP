import { useMemo } from 'react';
import { buildDailySummary } from '../lib/dailySummary';
import { useAppStore } from '../store/useAppStore';

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
    <header className="page-header page-header--summary">
      <h1 className="page-header-welcome">
        {summary.greeting} {summary.userName} {summary.emoji}
      </h1>
      <div className="page-header-brief">
        <span className="page-header-brief-label">היום יש לך:</span>
        <ul className="page-header-bullets">
          {summary.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </header>
  );
}
