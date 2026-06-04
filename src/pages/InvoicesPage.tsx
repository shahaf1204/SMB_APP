import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { formatCurrency } from '../lib/finance';
import { getClientName, getEventRevenueTotal } from '../lib/events';
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
  const navigate = useNavigate();
  const location = useLocation();
  const events = useAppStore((s) => s.events);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const invoices = useAppStore((s) => s.invoices);
  const createInvoice = useAppStore((s) => s.createInvoice);

  const [pickEventId, setPickEventId] = useState('');
  const [filter, setFilter] = useState<InvoiceFilter>('all');

  useEffect(() => {
    const fromEventId = (location.state as { fromEventId?: string } | null)?.fromEventId;
    if (fromEventId) setPickEventId(fromEventId);
  }, [location.state]);

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

  const handleCreateFromEvent = () => {
    if (!pickEventId) return;
    const client = getClientName(pickEventId, categories, eventValues) ?? 'לקוח';
    const amount = getEventRevenueTotal(pickEventId, eventValues);
    const id = createInvoice({ clientName: client, amount, eventId: pickEventId });
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
      </div>
      <BottomNav />
    </div>
  );
}
