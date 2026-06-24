import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { formatCurrency } from '../lib/finance';
import { isInvoiceOverdue } from '../lib/invoices';
import { useAppStore } from '../store/useAppStore';
import type { InvoiceStatus } from '../types/models';

const STATUS_HE: Record<InvoiceStatus, string> = {
  draft: 'טיוטה',
  sent: 'נשלחה',
  paid: 'שולמה',
};

type InvoiceFilter = 'all' | 'unpaid' | 'overdue';

export function InvoicesPage() {
  const invoices = useAppStore((s) => s.invoices);
  const [filter, setFilter] = useState<InvoiceFilter>('all');

  const filteredInvoices = useMemo(() => {
    if (filter === 'all') return invoices;
    if (filter === 'overdue') return invoices.filter(isInvoiceOverdue);
    return invoices.filter((i) => i.status !== 'paid');
  }, [invoices, filter]);

  return (
    <div className="app-shell">
      <div className="page">
        <div className="page-top-row">
          <h1 className="page-title">חשבוניות</h1>
          <Link to="/invoices/new" className="btn btn-primary btn-sm">
            + חדשה
          </Link>
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

        {filteredInvoices.length === 0 ? (
          <p className="empty-state">אין חשבוניות בסינון זה</p>
        ) : (
          <ul className="invoice-list invoice-list--slim">
            {filteredInvoices.map((inv) => {
              const overdue = isInvoiceOverdue(inv);
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
                      <span
                        className={`status-pill status-pill--sm ${overdue ? 'status-overdue' : `status-${inv.status}`}`}
                      >
                        {overdue ? 'באיחור' : STATUS_HE[inv.status]}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <Link
          to="/invoices/reports"
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: '0.75rem', display: 'block', textAlign: 'center', textDecoration: 'none' }}
        >
          דוחות ויצוא
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
