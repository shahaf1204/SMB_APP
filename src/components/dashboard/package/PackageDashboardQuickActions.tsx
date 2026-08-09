import { FileText, TicketCheck, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QUICK_ACTION_LABELS_HE } from '../../../config/operatingModelConfig';

export function PackageDashboardQuickActions() {
  return (
    <section className="dash-v2-section dash-v2-section--tight" aria-label="פעולות מהירות">
      <div className="dash-v2-section-head dash-v2-section-head--compact">
        <h2 className="dash-v2-section-title">פעולות מהירות</h2>
      </div>
      <div className="dash-v2-actions dash-v2-actions--package">
        <Link to="/create/pack" className="dash-v2-action dash-v2-action--accent">
          <span className="dash-v2-action-icon" aria-hidden>
            <TicketCheck size={22} strokeWidth={1.75} />
          </span>
          <span className="dash-v2-action-label">{QUICK_ACTION_LABELS_HE.new_package}</span>
        </Link>
        <Link to="/customers" className="dash-v2-action dash-v2-action--neutral">
          <span className="dash-v2-action-icon" aria-hidden>
            <UserPlus size={22} strokeWidth={1.75} />
          </span>
          <span className="dash-v2-action-label">{QUICK_ACTION_LABELS_HE.client}</span>
        </Link>
        <Link to="/invoices/new" className="dash-v2-action dash-v2-action--success">
          <span className="dash-v2-action-icon" aria-hidden>
            <FileText size={22} strokeWidth={1.75} />
          </span>
          <span className="dash-v2-action-label">{QUICK_ACTION_LABELS_HE.invoice}</span>
        </Link>
      </div>
    </section>
  );
}
