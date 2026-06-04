import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { buildCustomerSummaries } from '../lib/customers';
import { formatCurrency } from '../lib/finance';
import { useAppStore } from '../store/useAppStore';

const STATUS_HE: Record<string, string> = {
  draft: 'טיוטה',
  sent: 'נשלחה',
  paid: 'שולמה',
};

export function CustomerDetailPage() {
  const { key } = useParams();
  const events = useAppStore((s) => s.events);
  const leads = useAppStore((s) => s.leads);
  const invoices = useAppStore((s) => s.invoices);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);

  const customer = useMemo(() => {
    const all = buildCustomerSummaries(events, leads, invoices, categories, eventValues);
    return all.find((c) => c.key === key) ?? null;
  }, [key, events, leads, invoices, categories, eventValues]);

  const customerEvents = useMemo(
    () => events.filter((e) => customer?.eventIds.includes(e.id)),
    [events, customer],
  );
  const customerLeads = useMemo(
    () => leads.filter((l) => customer?.leadIds.includes(l.id)),
    [leads, customer],
  );
  const customerInvoices = useMemo(
    () => invoices.filter((i) => customer?.invoiceIds.includes(i.id)),
    [invoices, customer],
  );

  if (!customer) {
    return (
      <div className="app-shell">
        <div className="page">
          <p>לקוח לא נמצא</p>
          <Link to="/customers">חזרה</Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/customers" className="back-link">
          ← לקוחות
        </Link>
        <h1 className="page-title">{customer.name}</h1>
        <p className="page-subtitle">
          סה״כ הכנסות מאירועים: {formatCurrency(customer.totalRevenue)}
        </p>

        {customerEvents.length > 0 && (
          <section style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '0.95rem' }}>אירועים</h2>
            <ul className="link-list">
              {customerEvents.map((ev) => (
                <li key={ev.id}>
                  <Link to={`/events/${ev.id}/edit`} className="card compact-link-row">
                    {ev.title} · {new Date(ev.eventDate).toLocaleDateString('he-IL')}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {customerLeads.length > 0 && (
          <section style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '0.95rem' }}>לידים</h2>
            <ul className="link-list">
              {customerLeads.map((l) => (
                <li key={l.id}>
                  <Link to="/leads" className="card compact-link-row">
                    {l.name} · {new Date(l.createdAt).toLocaleDateString('he-IL')}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {customerInvoices.length > 0 && (
          <section>
            <h2 style={{ fontSize: '0.95rem' }}>חשבוניות</h2>
            <ul className="link-list">
              {customerInvoices.map((inv) => (
                <li key={inv.id}>
                  <Link to={`/invoices/${inv.id}`} className="card compact-link-row">
                    #{inv.invoiceNumber} · {formatCurrency(inv.amount)} · {STATUS_HE[inv.status]}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
