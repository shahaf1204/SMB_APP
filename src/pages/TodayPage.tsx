import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { buildDailyTasks } from '../lib/tasks';
import { useAppStore } from '../store/useAppStore';

export function TodayPage() {
  const events = useAppStore((s) => s.events);
  const leads = useAppStore((s) => s.leads);
  const invoices = useAppStore((s) => s.invoices);
  const tasks = useAppStore((s) => s.tasks);
  const dismissedAutoTasks = useAppStore((s) => s.dismissedAutoTasks);
  const addTask = useAppStore((s) => s.addTask);
  const toggleTask = useAppStore((s) => s.toggleTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const dismissAutoTask = useAppStore((s) => s.dismissAutoTask);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState(() => new Date().toISOString().slice(0, 10));

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayEvents = useMemo(
    () => events.filter((e) => e.eventDate === todayIso),
    [events, todayIso],
  );

  const dailyTasks = useMemo(
    () => buildDailyTasks(leads, events, invoices, tasks, dismissedAutoTasks),
    [leads, events, invoices, tasks, dismissedAutoTasks],
  );

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addTask(taskTitle, taskDue);
    setTaskTitle('');
  };

  const completeItem = (item: (typeof dailyTasks)[0]) => {
    if (item.kind === 'custom') {
      const taskId = item.id.replace('custom:', '');
      toggleTask(taskId);
    } else {
      dismissAutoTask(item.id);
    }
  };

  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">היום</h1>
        <p className="page-subtitle">משימות ואירועים ליום הנוכחי</p>

        {todayEvents.length > 0 && (
          <section className="card" style={{ marginBottom: '1rem' }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>אירועים היום</h2>
            <ul className="today-event-list">
              {todayEvents.map((ev) => (
                <li key={ev.id}>
                  <Link to={`/events/${ev.id}/edit`} className="today-event-link">
                    <strong>{ev.title}</strong>
                    {ev.location && <span> · {ev.location}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>משימות</h2>
          {dailyTasks.length === 0 ? (
            <p className="empty-state" style={{ padding: '0.5rem 0' }}>
              אין משימות פתוחות — כל הכבוד!
            </p>
          ) : (
            <ul className="task-list">
              {dailyTasks.map((item) => (
                <li key={item.id} className="task-row">
                  <button
                    type="button"
                    className="task-check"
                    aria-label="סמן כבוצע"
                    onClick={() => completeItem(item)}
                  >
                    ○
                  </button>
                  <div className="task-body">
                    {item.href ? (
                      <Link to={item.href} className="task-title-link">
                        {item.title}
                      </Link>
                    ) : (
                      <span className="task-title">{item.title}</span>
                    )}
                    {item.subtitle && <p className="task-sub">{item.subtitle}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={handleAddTask} className="card">
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>משימה חדשה</h2>
          <div className="field">
            <label htmlFor="task-title">תיאור</label>
            <input
              id="task-title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="לדוגמה: להתקשר לספק"
            />
          </div>
          <div className="field">
            <label htmlFor="task-due">תאריך יעד</label>
            <input
              id="task-due"
              type="date"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            הוסף משימה
          </button>
        </form>

        {tasks.filter((t) => t.done).length > 0 && (
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.85rem' }}>משימות שהושלמו</summary>
            <ul className="task-list" style={{ marginTop: '0.5rem' }}>
              {tasks
                .filter((t) => t.done)
                .map((t) => (
                  <li key={t.id} className="task-row done">
                    <span className="task-check done">✓</span>
                    <span>{t.title}</span>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => deleteTask(t.id)}
                    >
                      מחק
                    </button>
                  </li>
                ))}
            </ul>
          </details>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
