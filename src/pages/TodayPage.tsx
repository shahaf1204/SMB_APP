import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListTodo } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import {
  buildCompletedTasks,
  buildTodayTasks,
  buildWeekTasks,
  taskCounters,
  type DailyTaskItem,
} from '../lib/tasks';
import { useAppStore } from '../store/useAppStore';

function TaskRow({
  item,
  onComplete,
}: {
  item: DailyTaskItem;
  onComplete: (item: DailyTaskItem) => void;
}) {
  return (
    <li className={`task-row task-row-v2 ${item.isDone ? 'done' : ''}`}>
      {!item.isDone ? (
        <button
          type="button"
          className="task-check-v2"
          aria-label="סמן כבוצע"
          onClick={() => onComplete(item)}
        />
      ) : (
        <span className="task-check-v2 task-check-v2--done" aria-hidden />
      )}
      <div className="task-body">
        {item.href && !item.isDone ? (
          <Link to={item.href} className="task-title-link">
            {item.title}
          </Link>
        ) : (
          <span className="task-title">{item.title}</span>
        )}
        {item.subtitle && <p className="task-sub">{item.subtitle}</p>}
      </div>
    </li>
  );
}

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
  const [showModal, setShowModal] = useState(false);

  const todayTasks = useMemo(
    () => buildTodayTasks(leads, events, invoices, tasks, dismissedAutoTasks),
    [leads, events, invoices, tasks, dismissedAutoTasks],
  );

  const weekTasks = useMemo(() => buildWeekTasks(tasks), [tasks]);

  const completedTasks = useMemo(
    () => buildCompletedTasks(leads, events, invoices, tasks, dismissedAutoTasks),
    [leads, events, invoices, tasks, dismissedAutoTasks],
  );

  const counters = useMemo(
    () => taskCounters(leads, events, invoices, tasks, dismissedAutoTasks),
    [leads, events, invoices, tasks, dismissedAutoTasks],
  );

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addTask(taskTitle, taskDue);
    setTaskTitle('');
    setShowModal(false);
  };

  const completeItem = (item: DailyTaskItem) => {
    if (item.kind === 'custom') {
      toggleTask(item.id.replace('custom:', ''));
    } else {
      dismissAutoTask(item.id);
    }
  };

  const hasAnyTasks =
    todayTasks.length > 0 || weekTasks.length > 0 || completedTasks.length > 0;

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/more" className="back-link">
          ← עוד
        </Link>
        <h1 className="page-title">משימות</h1>

        <div className="task-counters">
          <div className="task-counter">
            <span className="task-counter-value">{counters.today}</span>
            <span className="task-counter-label">להיום</span>
          </div>
          <div className="task-counter">
            <span className="task-counter-value">{counters.thisWeek}</span>
            <span className="task-counter-label">השבוע</span>
          </div>
          <div className="task-counter">
            <span className="task-counter-value">{counters.completed}</span>
            <span className="task-counter-label">הושלמו</span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: '0.75rem' }}
          onClick={() => setShowModal(true)}
        >
          + משימה חדשה
        </button>

        {!hasAnyTasks ? (
          <EmptyState
            icon={ListTodo}
            title="אין משימות"
            message="הוסיפו משימה כדי לעקוב אחרי מה שחשוב"
            actionLabel="+ משימה חדשה"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <>
            <section className="task-section">
              <h2 className="section-title-sm">היום</h2>
              {todayTasks.length === 0 ? (
                <p className="empty-state empty-state--compact">אין משימות להיום</p>
              ) : (
                <ul className="task-list">
                  {todayTasks.map((item) => (
                    <TaskRow key={item.id} item={item} onComplete={completeItem} />
                  ))}
                </ul>
              )}
            </section>

            <section className="task-section">
              <h2 className="section-title-sm">השבוע</h2>
              {weekTasks.length === 0 ? (
                <p className="empty-state empty-state--compact">אין משימות השבוע</p>
              ) : (
                <ul className="task-list">
                  {weekTasks.map((item) => (
                    <TaskRow key={item.id} item={item} onComplete={completeItem} />
                  ))}
                </ul>
              )}
            </section>

            <section className="task-section">
              <h2 className="section-title-sm">הושלמו</h2>
              {completedTasks.length === 0 ? (
                <p className="empty-state empty-state--compact">אין משימות שהושלמו</p>
              ) : (
                <ul className="task-list">
                  {completedTasks.map((item) => (
                    <li key={item.id} className="task-row task-row-v2 done">
                      <span className="task-check-v2 task-check-v2--done" aria-hidden />
                      <span>{item.title}</span>
                      {item.kind === 'custom' && (
                        <button
                          type="button"
                          className="chip"
                          onClick={() => deleteTask(item.id.replace('custom:', ''))}
                        >
                          מחק
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="משימה חדשה">
        <form onSubmit={handleAddTask}>
          <div className="field">
            <label htmlFor="task-title">תיאור</label>
            <input
              id="task-title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="לדוגמה: להתקשר לספק"
              autoFocus
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
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            הוסף משימה
          </button>
        </form>
      </Modal>

      <BottomNav />
    </div>
  );
}
