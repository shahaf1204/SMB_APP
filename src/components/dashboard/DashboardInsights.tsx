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

function weekEndIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function DashboardInsights({
  events,
  invoices,
  customerCount,
  profit,
  revenue,
}: DashboardInsightsProps) {
  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = weekEndIso();

  const weekEvents = events.filter((e) => e.eventDate >= today && e.eventDate <= weekEnd);
  const openInvoices = invoices.filter((i) => i.status !== 'paid');
  const overdueCount = invoices.filter(isInvoiceOverdue).length;
  const marginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : null;

  return (
    <section className="dash-v2-section" aria-label="תובנות מהירות">
      <div className="dash-v2-section-head">
        <h2 className="dash-v2-section-title">מבט מהיר</h2>
        <p className="dash-v2-section-sub">השבוע · לקוחות · חשבוניות</p>
      </div>

      <div className="dash-v2-insights">
        <Link to="/activities" className="dash-v2-insight dash-v2-insight--events">
          <span className="dash-v2-insight-icon" aria-hidden>
            <CalendarDays size={20} strokeWidth={1.75} />
          </span>
          <span className="dash-v2-insight-value">{weekEvents.length}</span>
          <span className="dash-v2-insight-label">אירועים השבוע</span>
        </Link>

        <Link to="/customers" className="dash-v2-insight dash-v2-insight--customers">
          <span className="dash-v2-insight-icon" aria-hidden>
            <Users size={20} strokeWidth={1.75} />
          </span>
          <span className="dash-v2-insight-value">{customerCount}</span>
          <span className="dash-v2-insight-label">לקוחות</span>
        </Link>

        <Link to="/invoices" className="dash-v2-insight dash-v2-insight--invoices">
          <span className="dash-v2-insight-icon" aria-hidden>
            <FileText size={20} strokeWidth={1.75} />
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
