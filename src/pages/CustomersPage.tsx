import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { buildCustomerSummaries } from '../lib/customers';
import { formatCurrency } from '../lib/finance';
import { useAppStore } from '../store/useAppStore';

export function CustomersPage() {
  const events = useAppStore((s) => s.events);
  const leads = useAppStore((s) => s.leads);
  const invoices = useAppStore((s) => s.invoices);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);

  const customers = useMemo(
    () => buildCustomerSummaries(events, leads, invoices, categories, eventValues),
    [events, leads, invoices, categories, eventValues],
  );

  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">לקוחות</h1>

        {customers.length === 0 ? (
          <p className="empty-state">עדיין אין לקוחות</p>
        ) : (
          <ul className="customer-list">
            {customers.map((c) => (
              <li key={c.key}>
                <Link to={`/customers/${c.key}`} className="card customer-card">
                  <div className="customer-card-main">
                    <strong>{c.name}</strong>
                    <p className="customer-card-contact">
                      {c.phone && <span>{c.phone}</span>}
                      {c.phone && c.email && ' · '}
                      {c.email && <span>{c.email}</span>}
                      {!c.phone && !c.email && (
                        <span className="customer-card-muted">אין פרטי קשר</span>
                      )}
                    </p>
                  </div>
                  <div className="customer-card-side">
                    <span className="customer-revenue">{formatCurrency(c.totalRevenue)}</span>
                    <span className="customer-card-count">{c.activityCount} פעילויות</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
