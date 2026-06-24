import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/ui/EmptyState';
import { PillTabs } from '../components/ui/PillTabs';
import { formatCurrency } from '../lib/finance';
import { isInvoiceOverdue } from '../lib/invoices';
import {
  filterInvoicesByTab,
  summarizeInvoicesPage,
  type InvoiceFilterTab,
} from '../lib/invoiceSummary';
import { useAppStore } from '../store/useAppStore';
import type { Invoice } from '../types/models';

const FILTER_TABS: Array<{ id: InvoiceFilterTab; label: string }> = [
  { id: 'all', label: 'הכל' },
  { id: 'paid', label: 'שולמו' },
  { id: 'pending', label: 'ממתין' },
  { id: 'overdue', label: 'באיחור' },
];

function statusChip(inv: Invoice) {
  if (isInvoiceOverdue(inv)) return { label: 'באיחור', className: 'chip-danger' };
  if (inv.status === 'paid') return { label: 'שולם', className: 'chip-success' };
  return { label: 'ממתין', className: 'chip-warning' };
}

export function InvoicesPage() {
  const invoices = useAppStore((s) => s.invoices);
  const [filter, setFilter] = useState<InvoiceFilterTab>('all');

  const summary = useMemo(() => summarizeInvoicesPage(invoices), [invoices]);
  const filteredInvoices = useMemo(
    () => filterInvoicesByTab(invoices, filter),
    [invoices, filter],
  );

  return (
    <div className="app-shell">
      <div className="page">
        <div className="page-top-row">
          <h1 className="page-title">חשבוניות</h1>
          <Link to="/invoices/new" className="btn btn-primary btn-sm">
            + חדשה
          </Link>
        </div>

        <div className="kpi-row kpi-row--4">
          <div className="kpi-card kpi-card--revenue">
            <span className="kpi-card-label">החודש</span>
            <span className="kpi-card-value">{formatCurrency(summary.monthlyRevenue)}</span>
          </div>
          <div className="kpi-card kpi-card--profit">
            <span className="kpi-card-label">שולמו</span>
            <span className="kpi-card-value">{summary.paidCount}</span>
          </div>
          <div className="kpi-card kpi-card--expense">
            <span className="kpi-card-label">ממתין</span>
            <span className="kpi-card-value">{summary.pendingCount}</span>
          </div>
          <div className="kpi-card kpi-card--danger">
            <span className="kpi-card-label">באיחור</span>
            <span className="kpi-card-value">{summary.overdueCount}</span>
          </div>
        </div>

        <PillTabs tabs={FILTER_TABS} active={filter} onChange={setFilter} ariaLabel="סינון חשבוניות" />

        {filteredInvoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="אין חשבוניות"
            message="הפיקו חשבונית מאירוע קיים"
            actionLabel="+ חשבונית חדשה"
            actionTo="/invoices/new"
          />
        ) : (
          <ul className="invoice-list invoice-list--slim">
            {filteredInvoices.map((inv) => {
              const chip = statusChip(inv);
              return (
                <li key={inv.id}>
                  <Link to={`/invoices/${inv.id}`} className="card invoice-slim-row">
                    <div className="invoice-slim-main">
                      <strong className="invoice-slim-client">{inv.clientName}</strong>
                      <span className="invoice-slim-date">
                        {new Date(inv.issuedAt).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                    <div className="invoice-slim-side">
                      <span className="invoice-slim-amount">{formatCurrency(inv.amount)}</span>
                      <span className={`status-chip ${chip.className}`}>{chip.label}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <Link to="/invoices/reports" className="text-link-muted">
          דוחות ויצוא ←
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
