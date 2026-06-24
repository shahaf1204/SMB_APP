import { CalendarPlus, FileText, ListTodo } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CREATE_ROUTES } from '../../lib/workModel';

export function DashboardQuickActions() {
  return (
    <section className="dash-section" aria-label="פעולות מהירות">
      <h2 className="dash-section-label">פעולות מהירות</h2>
      <div className="quick-actions-row">
        <Link to={CREATE_ROUTES.single_event} className="quick-action-btn">
          <span className="quick-action-btn-icon quick-action-btn-icon--primary">
            <CalendarPlus size={20} strokeWidth={2} />
          </span>
          <span className="quick-action-btn-label">אירוע חדש</span>
        </Link>
        <Link to="/invoices/new" className="quick-action-btn">
          <span className="quick-action-btn-icon quick-action-btn-icon--success">
            <FileText size={20} strokeWidth={2} />
          </span>
          <span className="quick-action-btn-label">חשבונית חדשה</span>
        </Link>
        <Link to="/today" className="quick-action-btn">
          <span className="quick-action-btn-icon quick-action-btn-icon--accent">
            <ListTodo size={20} strokeWidth={2} />
          </span>
          <span className="quick-action-btn-label">משימה חדשה</span>
        </Link>
      </div>
    </section>
  );
}
