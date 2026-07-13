import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plug } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/ui/EmptyState';
import { PillTabs } from '../components/ui/PillTabs';
import { getCatalogEntry } from '../integrations/catalog';
import { formatCurrency } from '../lib/finance';
import { isInvoiceOverdue } from '../lib/invoices';
import {
  filterInvoicesByTab,
  summarizeInvoicesPage,
  type InvoiceFilterTab,
} from '../lib/invoiceSummary';
import { getActiveFinanceConnection } from '../lib/integrations/client';
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

function providerLabel(inv: Invoice): string | null {
  const id = inv.externalProvider ?? inv.provider;
  if (!id) return null;
  return getCatalogEntry(id)?.nameHe ?? id;
}

export function InvoicesPage() {
  const business = useAppStore((s) => s.business)!;
  const invoices = useAppStore((s) => s.invoices);
  const connections = useAppStore((s) => s.integrationConnections);
  const [filter, setFilter] = useState<InvoiceFilterTab>('all');

  const financeConnected = !!getActiveFinanceConnection(connections, business.id);

  const summary = useMemo(() => summarizeInvoicesPage(invoices), [invoices]);
  const filteredInvoices = useMemo(
    () => filterInvoicesByTab(invoices, filter),
    [invoices, filter],
  );

  if (!financeConnected) {
    return (
      <div className="app-shell">
        <div className="page">
          <h1 className="page-title">חשבוניות</h1>
          <EmptyState
            icon={Plug}
            title="חברו ספק חשבוניות"
            message="חברו Morning, Grow או ספק אחר כדי להפיק חשבוניות מס רשמיות וקישורי תשלום"
            actionLabel="חיבור ספק"
            actionTo="/settings/connections"
          />
          {invoices.length > 0 && (
            <>
              <p className="section-title-sm" style={{ marginTop: '1.5rem' }}>
                טיוטות מקומיות ({invoices.length})
              </p>
              <ul className="invoice-list invoice-list--slim">
                {invoices.slice(0, 5).map((inv) => (
                  <li key={inv.id}>
                    <Link to={`/invoices/${inv.id}`} className="card invoice-slim-row">
                      <div className="invoice-slim-main">
                        <strong>{inv.clientName}</strong>
                        <span className="invoice-slim-date">
                          {formatCurrency(inv.amount)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page">
        <div className="page-top-row">
          <div>
            <h1 className="page-title">חשבוניות</h1>
            <p className="page-subtitle page-subtitle--inline">הפקה, מעקב תשלומים ודוחות</p>
          </div>
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
            message="החשבוניות יופיעו כאן אוטומטית לאחר הפקה"
            actionLabel="+ חשבונית חדשה"
            actionTo="/invoices/new"
          />
        ) : (
          <ul className="invoice-list invoice-list--slim">
            {filteredInvoices.map((inv) => {
              const chip = statusChip(inv);
              const prov = providerLabel(inv);
              return (
                <li key={inv.id}>
                  <Link to={`/invoices/${inv.id}`} className="card invoice-slim-row invoice-slim-row--rich">
                    <div className="invoice-slim-main">
                      <strong className="invoice-slim-client">{inv.clientName}</strong>
                      <span className="invoice-slim-date">
                        {new Date(inv.issuedAt).toLocaleDateString('he-IL')}
                        {prov && <> · {prov}</>}
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
