import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileInput, Users } from 'lucide-react';
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
        <p className="page-subtitle">כל מי שעבד איתך — מאירועים, לידים וחשבוניות</p>

        <section className="card sources-inline-cta">
          <p>
            <FileInput size={16} aria-hidden style={{ verticalAlign: 'middle', marginLeft: 6 }} />
            רוצים שלקוחות יגיעו אוטומטית מטופס?{' '}
            <Link to="/sources/forms">חיבור טופס</Link>
          </p>
        </section>

        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="אין לקוחות עדיין"
            message="חברי טופס forms.app או הוסיפו שם לקוח באירוע כדי לבנות את מאגר הלקוחות"
            actionLabel="חיבור טופס"
            actionTo="/sources/forms"
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
