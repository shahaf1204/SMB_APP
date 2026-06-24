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
    <section className="dash-insights" aria-label="תובנות מהירות">
      <Link to="/activities" className="dash-insight-card dash-insight-card--violet">
        <span className="dash-insight-icon" aria-hidden>
          <CalendarDays size={18} strokeWidth={2} />
        </span>
        <span className="dash-insight-value">{weekEvents.length}</span>
        <span className="dash-insight-label">אירועים השבוע</span>
      </Link>

      <Link to="/customers" className="dash-insight-card dash-insight-card--sky">
        <span className="dash-insight-icon" aria-hidden>
          <Users size={18} strokeWidth={2} />
        </span>
        <span className="dash-insight-value">{customerCount}</span>
        <span className="dash-insight-label">לקוחות</span>
      </Link>

      <Link to="/invoices" className="dash-insight-card dash-insight-card--amber">
        <span className="dash-insight-icon" aria-hidden>
          <FileText size={18} strokeWidth={2} />
        </span>
        <span className="dash-insight-value">{openInvoices.length}</span>
        <span className="dash-insight-label">
          {overdueCount > 0 ? `${overdueCount} באיחור` : 'חשבוניות פתוחות'}
        </span>
      </Link>

      {marginPct != null && revenue > 0 && (
        <div className="dash-margin-strip">
          <span>מרווח החודש</span>
          <strong>{marginPct}%</strong>
          <span className="dash-margin-sub">{formatCurrency(profit)} רווח</span>
        </div>
      )}
    </section>
  );
}
