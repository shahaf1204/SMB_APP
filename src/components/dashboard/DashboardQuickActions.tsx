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
    label: 'מקורות כניסה',
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
    <section className="dash-section" aria-label="פעולות מהירות">
      <h2 className="dash-section-label">פעולות מהירות</h2>
      <div className="quick-actions-row quick-actions-row--4">
        {ACTIONS.map(({ to, label, icon: Icon, variant }) => (
          <Link key={to} to={to} className="quick-action-btn">
            <span className={`quick-action-btn-icon quick-action-btn-icon--${variant}`}>
              <Icon size={20} strokeWidth={2} />
            </span>
            <span className="quick-action-btn-label">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
