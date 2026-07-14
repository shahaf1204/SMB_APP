import { CalendarPlus, FileText, Inbox, ListTodo } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CREATE_ROUTES } from '../../lib/workModel';

const ACTIONS = [
  {
    to: CREATE_ROUTES.single_event,
    label: 'אירוע חדש',
    icon: CalendarPlus,
    variant: 'primary' as const,
  },
  {
    to: '/invoices/new',
    label: 'חשבונית',
    icon: FileText,
    variant: 'success' as const,
  },
  {
    to: '/sources',
    label: 'מקורות',
    icon: Inbox,
    variant: 'accent' as const,
  },
  {
    to: '/today',
    label: 'משימות',
    icon: ListTodo,
    variant: 'neutral' as const,
  },
];

export function DashboardQuickActions() {
  return (
    <section className="dash-v2-section dash-v2-section--tight" aria-label="פעולות מהירות">
      <div className="dash-v2-section-head dash-v2-section-head--compact">
        <h2 className="dash-v2-section-title">פעולות מהירות</h2>
      </div>
      <div className="dash-v2-actions">
        {ACTIONS.map(({ to, label, icon: Icon, variant }) => (
          <Link key={to} to={to} className={`dash-v2-action dash-v2-action--${variant}`}>
            <span className="dash-v2-action-icon" aria-hidden>
              <Icon size={24} strokeWidth={1.75} />
            </span>
            <span className="dash-v2-action-label">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
