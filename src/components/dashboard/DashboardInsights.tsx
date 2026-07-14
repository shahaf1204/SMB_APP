import { CalendarDays, FileText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/finance';
import { isInvoiceOverdue } from '../../lib/invoices';
import type { Event, Invoice } from '../../types/models';

interface DashboardInsightsProps {
  events: Event[];
  invoices: Invoice[];
  customerCount: number;
  profit: number;
  revenue: number;
}

export function DashboardInsights({
  events,
  invoices,
  customerCount,
  profit,
  revenue,
}: DashboardInsightsProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = events.filter((e) => {
    const d = new Date(e.eventDate);
    d.setHours(0, 0, 0, 0);
    return d >= today;
  });

  const openInvoices = invoices.filter((i) => i.status !== 'paid');
  const overdueCount = invoices.filter(isInvoiceOverdue).length;
  const marginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : null;

  return (
    <section className="dash-v2-section dash-v2-section--tight" aria-label="תובנות מהירות">
      <div className="dash-v2-section-head dash-v2-section-head--compact">
        <h2 className="dash-v2-section-title">מבט מהיר</h2>
      </div>

      <div className="dash-v2-insights">
        <Link to="/activities" className="dash-v2-insight dash-v2-insight--events dash-v2-lift">
          <span className="dash-v2-insight-icon" aria-hidden>
            <CalendarDays size={18} strokeWidth={1.75} />
          </span>
          <span className="dash-v2-insight-value">{upcomingEvents.length}</span>
          <span className="dash-v2-insight-label">אירועים קרובים</span>
        </Link>

        <Link to="/customers" className="dash-v2-insight dash-v2-insight--customers dash-v2-lift">
          <span className="dash-v2-insight-icon" aria-hidden>
            <Users size={18} strokeWidth={1.75} />
          </span>
          <span className="dash-v2-insight-value">{customerCount}</span>
          <span className="dash-v2-insight-label">לקוחות</span>
        </Link>

        <Link to="/invoices" className="dash-v2-insight dash-v2-insight--invoices dash-v2-lift">
          <span className="dash-v2-insight-icon" aria-hidden>
            <FileText size={18} strokeWidth={1.75} />
          </span>
          <span className="dash-v2-insight-value">{openInvoices.length}</span>
          <span className="dash-v2-insight-label">
            {overdueCount > 0 ? `${overdueCount} באיחור` : 'חשבוניות פתוחות'}
          </span>
        </Link>
      </div>

      {marginPct != null && revenue > 0 && (
        <div className="dash-v2-margin">
          <span>מרווח החודש</span>
          <strong>{marginPct}%</strong>
          <span className="dash-v2-margin-sub">{formatCurrency(profit)} רווח</span>
        </div>
      )}
    </section>
  );
}
