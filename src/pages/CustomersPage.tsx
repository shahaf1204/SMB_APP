import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
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
          <EmptyState
            icon={Users}
            title="אין לקוחות עדיין"
            message="הוסיפו שם לקוח באירוע או ליד כדי לבנות את מאגר הלקוחות"
            actionLabel="+ אירוע חדש"
            actionTo="/create/event"
          />
        ) : (
          <ul className="customer-list">
            {customers.map((c) => (
              <li key={c.key}>
                <Link to={`/customers/${c.key}`} className="card customer-card-v2">
                  <Avatar name={c.name} size="md" />
                  <div className="customer-card-v2-body">
                    <strong>{c.name}</strong>
                    <p className="customer-card-v2-contact">
                      {c.phone || c.email || 'אין פרטי קשר'}
                    </p>
                    <span className="customer-card-v2-meta">
                      {c.activityCount} פעילויות
                    </span>
                  </div>
                  <div className="customer-card-v2-side">
                    <span className="customer-revenue">{formatCurrency(c.totalRevenue)}</span>
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
