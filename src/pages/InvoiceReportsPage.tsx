import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { formatCurrency } from '../lib/finance';
import {
  availableInvoiceReportYears,
  downloadInvoiceReport,
  filterInvoicesByRange,
  formatInvoiceReportPeriodLabel,
  invoiceReportMailtoHref,
  summarizeInvoices,
  type InvoiceReportRange,
} from '../lib/invoiceReport';
import { downloadPeriodReport } from '../lib/report';
import { useAppStore } from '../store/useAppStore';
import type { PeriodFilter } from '../types/models';

export function InvoiceReportsPage() {
  const events = useAppStore((s) => s.events);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const invoices = useAppStore((s) => s.invoices);
  const business = useAppStore((s) => s.business)!;

  const [reportKind, setReportKind] = useState<'month' | 'year'>('month');
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportYear, setReportYear] = useState(() => String(new Date().getFullYear()));
  const [reportPeriod, setReportPeriod] = useState<PeriodFilter>('thisMonth');

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
      summary: summarizeInvoices(inRange),
      label: formatInvoiceReportPeriodLabel(reportRange),
    };
  }, [invoices, reportRange]);

  const reportMailto = useMemo(
    () => invoiceReportMailtoHref(invoices, business, reportRange),
    [invoices, business, reportRange],
  );

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/invoices" className="back-link">
          ← חשבוניות
        </Link>
        <h1 className="page-title">דוחות ויצוא</h1>

        <section className="card invoice-report-card">
          <h2 className="section-title-sm">דוח לרואה חשבון</h2>

          <div className="chip-row" style={{ marginBottom: '0.75rem' }}>
            <button
              type="button"
              className={`chip ${reportKind === 'month' ? 'active' : ''}`}
              onClick={() => setReportKind('month')}
            >
              חודשי
            </button>
            <button
              type="button"
              className={`chip ${reportKind === 'year' ? 'active' : ''}`}
              onClick={() => setReportKind('year')}
            >
              שנתי
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
                אין חשבוניות בתקופה
              </p>
            ) : (
              <ul className="invoice-report-stats">
                <li>
                  {reportPreview.summary.count} · {formatCurrency(reportPreview.summary.totalAmount)}
                </li>
                <li>
                  שולמו: {reportPreview.summary.paidCount} (
                  {formatCurrency(reportPreview.summary.paidAmount)})
                </li>
                <li>
                  ממתין: {reportPreview.summary.unpaidCount} (
                  {formatCurrency(reportPreview.summary.unpaidAmount)})
                </li>
              </ul>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={reportPreview.summary.count === 0}
            onClick={() => downloadInvoiceReport(invoices, business, reportRange)}
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
          >
            שליחה לרואה חשבון
          </a>
        </section>

        <section className="card" style={{ marginTop: '0.75rem' }}>
          <h2 className="section-title-sm">דוח תקופה (אירועים)</h2>
          <div className="field">
            <label htmlFor="report-period">תקופה</label>
            <select
              id="report-period"
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value as PeriodFilter)}
            >
              <option value="thisMonth">החודש הנוכחי</option>
              <option value="lastMonth">חודש שעבר</option>
              <option value="last30">30 יום אחרונים</option>
              <option value="ytd">מתחילת השנה</option>
              <option value="allTime">כל הזמנים</option>
            </select>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() =>
              downloadPeriodReport(events, eventValues, categories, reportPeriod, business.name)
            }
          >
            הורדת דוח CSV
          </button>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
