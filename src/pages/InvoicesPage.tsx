import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { formatCurrency } from '../lib/finance';
import { getClientName, getEventRevenueTotal } from '../lib/events';
import { isInvoiceOverdue } from '../lib/invoices';
import {
  availableInvoiceReportYears,
  downloadInvoiceReport,
  filterInvoicesByRange,
  formatInvoiceReportPeriodLabel,
  invoiceReportMailtoHref,
  summarizeInvoices,
  type InvoiceReportRange,
} from '../lib/invoiceReport';
import { useAppStore } from '../store/useAppStore';
import type { InvoiceStatus } from '../types/models';

const STATUS_HE: Record<InvoiceStatus, string> = {
  draft: 'טיוטה',
  sent: 'נשלחה',
  paid: 'שולמה',
};

type InvoiceFilter = 'all' | 'unpaid' | 'overdue';

export function InvoicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const events = useAppStore((s) => s.events);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const invoices = useAppStore((s) => s.invoices);
  const createInvoice = useAppStore((s) => s.createInvoice);

  const [pickEventId, setPickEventId] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [reportKind, setReportKind] = useState<'month' | 'year'>('month');
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportYear, setReportYear] = useState(() => String(new Date().getFullYear()));

  const business = useAppStore((s) => s.business)!;

  useEffect(() => {
    const fromEventId = (location.state as { fromEventId?: string } | null)?.fromEventId;
    if (fromEventId) setPickEventId(fromEventId);
  }, [location.state]);

  useEffect(() => {
    if (!pickEventId) {
      setClientEmail('');
      return;
    }
    const event = events.find((e) => e.id === pickEventId);
    setClientEmail(event?.clientEmail ?? '');
  }, [pickEventId, events]);

  const recentEvents = useMemo(
    () =>
      [...events]
        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
        .slice(0, 20),
    [events],
  );

  const filteredInvoices = useMemo(() => {
    if (filter === 'all') return invoices;
    if (filter === 'overdue') return invoices.filter(isInvoiceOverdue);
    return invoices.filter((i) => i.status !== 'paid');
  }, [invoices, filter]);

  const reportRange = useMemo((): InvoiceReportRange => {
    if (reportKind === 'year') {
      return { kind: 'year', year: Number(reportYear) };
    }
    const [y, m] = reportMonth.split('-').map(Number);
    return { kind: 'month', year: y, month: m };
  }, [reportKind, reportMonth, reportYear]);

  const reportYears = useMemo(() => availableInvoiceReportYears(invoices), [invoices]);

  const reportPreview = useMemo(() => {
    const inRange = filterInvoicesByRange(invoices, reportRange);
    return {
      invoices: inRange,
      summary: summarizeInvoices(inRange),
      label: formatInvoiceReportPeriodLabel(reportRange),
    };
  }, [invoices, reportRange]);

  const reportMailto = useMemo(
    () => invoiceReportMailtoHref(invoices, business, reportRange),
    [invoices, business, reportRange],
  );

  const handleDownloadReport = () => {
    downloadInvoiceReport(invoices, business, reportRange);
  };

  const handleCreateFromEvent = () => {
    if (!pickEventId) return;
    const event = events.find((e) => e.id === pickEventId);
    const client = getClientName(pickEventId, categories, eventValues) ?? 'לקוח';
    const amount = getEventRevenueTotal(pickEventId, eventValues);
    const id = createInvoice({
      clientName: client,
      clientEmail: clientEmail.trim() || event?.clientEmail,
      amount,
      eventId: pickEventId,
    });
    if (id) navigate(`/invoices/${id}`);
  };

  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">חשבוניות</h1>
        <p className="page-subtitle">מעקב תשלומים והפקה מאירוע</p>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="field">
            <label htmlFor="inv-event">בחרו אירוע</label>
            <select id="inv-event" value={pickEventId} onChange={(e) => setPickEventId(e.target.value)}>
              <option value="">—</option>
              {recentEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} · {new Date(ev.eventDate).toLocaleDateString('he-IL')}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="inv-email">אימייל לקוח</label>
            <input
              id="inv-email"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="לדוגמה: client@example.com"
              autoComplete="email"
            />
            <p className="field-hint">
              {clientEmail.trim()
                ? 'יישמר בחשבונית וישמש לשליחה במייל'
                : 'אופציונלי — ניתן להוסיף כאן אם לא הוזן באירוע'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!pickEventId}
            onClick={handleCreateFromEvent}
          >
            הפק חשבונית
          </button>
        </div>

        <div className="filter-chips" style={{ marginBottom: '0.75rem' }}>
          {(
            [
              ['all', 'הכל'],
              ['unpaid', 'לא שולמו'],
              ['overdue', 'באיחור'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`chip ${filter === id ? 'chip-active' : ''}`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <h2 style={{ fontSize: '0.95rem', margin: '0 0 0.5rem' }}>חשבוניות שהופקו</h2>
        {filteredInvoices.length === 0 ? (
          <p className="empty-state">אין חשבוניות בסינון זה</p>
        ) : (
          <ul className="invoice-list">
            {filteredInvoices.map((inv) => {
              const overdue = isInvoiceOverdue(inv);
              return (
                <li key={inv.id}>
                  <Link to={`/invoices/${inv.id}`} className="card invoice-row">
                    <div>
                      <strong>#{inv.invoiceNumber}</strong> · {inv.clientName}
                      {overdue && (
                        <span className="status-pill status-overdue" style={{ marginRight: '0.35rem' }}>
                          באיחור
                        </span>
                      )}
                    </div>
                    <div className="invoice-row-meta">
                      {formatCurrency(inv.amount)} · {STATUS_HE[inv.status]} · לתשלום עד{' '}
                      {new Date(inv.dueDate).toLocaleDateString('he-IL')}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <section className="card invoice-report-card">
          <h2 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>דוח לרואה חשבון</h2>
          <p className="page-subtitle" style={{ margin: '0 0 0.75rem' }}>
            ייצוא CSV חודשי או שנתי — להורדה ושליחה במייל
          </p>

          <div className="chip-row" style={{ marginBottom: '0.75rem' }}>
            <button
              type="button"
              className={`chip ${reportKind === 'month' ? 'active' : ''}`}
              onClick={() => setReportKind('month')}
            >
              דוח חודשי
            </button>
            <button
              type="button"
              className={`chip ${reportKind === 'year' ? 'active' : ''}`}
              onClick={() => setReportKind('year')}
            >
              דוח שנתי
            </button>
          </div>

          {reportKind === 'month' ? (
            <div className="field">
              <label htmlFor="report-month">חודש</label>
              <input
                id="report-month"
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
              />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="report-year">שנה</label>
              <select
                id="report-year"
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
              >
                {reportYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="invoice-report-summary">
            <p style={{ margin: '0 0 0.35rem', fontWeight: 600 }}>{reportPreview.label}</p>
            {reportPreview.summary.count === 0 ? (
              <p className="empty-state" style={{ margin: 0, fontSize: '0.85rem' }}>
                אין חשבוניות בתקופה זו
              </p>
            ) : (
              <ul className="invoice-report-stats">
                <li>
                  {reportPreview.summary.count} חשבוניות ·{' '}
                  {formatCurrency(reportPreview.summary.totalAmount)}
                </li>
                <li>
                  שולמו: {reportPreview.summary.paidCount} (
                  {formatCurrency(reportPreview.summary.paidAmount)})
                </li>
                <li>
                  ממתין: {reportPreview.summary.unpaidCount} (
                  {formatCurrency(reportPreview.summary.unpaidAmount)})
                </li>
                {reportPreview.summary.overdueCount > 0 && (
                  <li className="invoice-report-overdue">
                    באיחור: {reportPreview.summary.overdueCount} (
                    {formatCurrency(reportPreview.summary.overdueAmount)})
                  </li>
                )}
              </ul>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={reportPreview.summary.count === 0}
            onClick={handleDownloadReport}
          >
            הורדת דוח CSV
          </button>
          <a
            href={reportMailto}
            className="btn btn-ghost"
            style={{
              width: '100%',
              marginTop: '0.5rem',
              display: 'inline-flex',
              pointerEvents: reportPreview.summary.count === 0 ? 'none' : undefined,
              opacity: reportPreview.summary.count === 0 ? 0.5 : 1,
            }}
            aria-disabled={reportPreview.summary.count === 0}
            onClick={(e) => {
              if (reportPreview.summary.count === 0) e.preventDefault();
            }}
          >
            שליחה לרואה חשבון (מייל)
          </a>
          <p className="field-hint" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
            הורידי קודם את ה-CSV, ואז צרפי אותו למייל שנפתח
          </p>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
