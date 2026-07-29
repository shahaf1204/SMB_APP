import { CalendarPlus, FileText, Inbox, ListTodo, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreateActivitySheet } from '../create/CreateActivitySheet';
import { useCreateActivityFlow } from '../../hooks/useCreateActivityFlow';

export function DashboardQuickActions() {
  const { models, sheetOpen, openCreate, closeSheet, navigateToModel } = useCreateActivityFlow();
  const createLabel = models.length === 1 ? models[0].label : 'פעילות חדשה';

  return (
    <section className="dash-v2-section dash-v2-section--tight" aria-label="פעולות מהירות">
      <div className="dash-v2-section-head dash-v2-section-head--compact">
        <h2 className="dash-v2-section-title">פעולות מהירות</h2>
      </div>
      <div className="dash-v2-actions">
        <button
          type="button"
          className="dash-v2-action dash-v2-action--primary"
          onClick={openCreate}
        >
          <span className="dash-v2-action-icon" aria-hidden>
            <CalendarPlus size={22} strokeWidth={1.75} />
          </span>
          <span className="dash-v2-action-label">{createLabel}</span>
        </button>
        <Link to="/invoices?tab=expenses&new=1" className="dash-v2-action dash-v2-action--expense">
          <span className="dash-v2-action-icon" aria-hidden>
            <Receipt size={22} strokeWidth={1.75} />
          </span>
          <span className="dash-v2-action-label">הוצאה חדשה</span>
        </Link>
        <Link to="/invoices/new" className="dash-v2-action dash-v2-action--success">
          <span className="dash-v2-action-icon" aria-hidden>
            <FileText size={22} strokeWidth={1.75} />
          </span>
          <span className="dash-v2-action-label">חשבונית</span>
        </Link>
        <Link to="/sources" className="dash-v2-action dash-v2-action--accent">
          <span className="dash-v2-action-icon" aria-hidden>
            <Inbox size={22} strokeWidth={1.75} />
          </span>
          <span className="dash-v2-action-label">מקורות</span>
        </Link>
        <Link to="/today" className="dash-v2-action dash-v2-action--neutral">
          <span className="dash-v2-action-icon" aria-hidden>
            <ListTodo size={22} strokeWidth={1.75} />
          </span>
          <span className="dash-v2-action-label">משימות</span>
        </Link>
      </div>
      {models.length > 1 && (
        <CreateActivitySheet
          open={sheetOpen}
          onClose={closeSheet}
          models={models}
          onSelect={navigateToModel}
        />
      )}
    </section>
  );
}
