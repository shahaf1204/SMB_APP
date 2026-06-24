import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Avatar } from '../components/ui/Avatar';
import { PillTabs } from '../components/ui/PillTabs';
import { buildCustomerSummaries } from '../lib/customers';
import { formatCurrency, formatDate } from '../lib/finance';
import { getEventRevenueTotal } from '../lib/events';
import { isInvoiceOverdue } from '../lib/invoices';
import { useAppStore } from '../store/useAppStore';

type ClientTab = 'activities' | 'invoices' | 'tasks' | 'notes';

const TABS: Array<{ id: ClientTab; label: string }> = [
  { id: 'activities', label: 'פעילויות' },
  { id: 'invoices', label: 'חשבוניות' },
  { id: 'tasks', label: 'משימות' },
  { id: 'notes', label: 'הערות' },
];

const STATUS_HE: Record<string, string> = {
  draft: 'ממתין',
  sent: 'ממתין',
  paid: 'שולם',
};

export function CustomerDetailPage() {
  const { key } = useParams();
  const [tab, setTab] = useState<ClientTab>('activities');

  const events = useAppStore((s) => s.events);
  const leads = useAppStore((s) => s.leads);
  const invoices = useAppStore((s) => s.invoices);
  const tasks = useAppStore((s) => s.tasks);
  const engagements = useAppStore((s) => s.engagements ?? []);
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
  const customerEngagements = useMemo(
    () =>
      engagements.filter(
        (e) => e.clientName.trim().toLowerCase() === customer?.name.trim().toLowerCase(),
      ),
    [engagements, customer],
  );
  const customerInvoices = useMemo(
    () => invoices.filter((i) => customer?.invoiceIds.includes(i.id)),
    [invoices, customer],
  );
  const customerLeads = useMemo(
    () => leads.filter((l) => customer?.leadIds.includes(l.id)),
    [leads, customer],
  );
  const customerTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          customer &&
          t.title.toLowerCase().includes(customer.name.trim().toLowerCase()),
      ),
    [tasks, customer],
  );

  if (!customer) {
    return (
      <div className="app-shell">
        <div className="page">
          <Link to="/customers" className="back-link">
            ← לקוחות
          </Link>
          <p>לקוח לא נמצא</p>
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

        <header className="client-header">
          <Avatar name={customer.name} size="lg" />
          <div className="client-header-body">
            <h1 className="client-header-name">{customer.name}</h1>
            {customer.phone && (
              <p className="client-header-contact">
                <Phone size={14} aria-hidden />
                {customer.phone}
              </p>
            )}
            {customer.email && (
              <p className="client-header-contact">
                <Mail size={14} aria-hidden />
                {customer.email}
              </p>
            )}
          </div>
        </header>

        <div className="kpi-row kpi-row--client">
          <div className="kpi-card kpi-card--revenue">
            <span className="kpi-card-label">הכנסות</span>
            <span className="kpi-card-value">{formatCurrency(customer.totalRevenue)}</span>
          </div>
          <div className="kpi-card kpi-card--profit">
            <span className="kpi-card-label">פעילויות</span>
            <span className="kpi-card-value">{customer.activityCount}</span>
          </div>
          <div className="kpi-card kpi-card--expense">
            <span className="kpi-card-label">חשבוניות</span>
            <span className="kpi-card-value">{customer.invoiceIds.length}</span>
          </div>
        </div>

        <PillTabs tabs={TABS} active={tab} onChange={setTab} ariaLabel="טאבי לקוח" />

        <div className="client-tab-panel">
          {tab === 'activities' && (
            <>
              {customerEvents.length === 0 && customerEngagements.length === 0 ? (
                <p className="empty-state empty-state--compact">אין פעילויות ללקוח זה</p>
              ) : (
                <ul className="link-list">
                  {customerEvents.map((ev) => (
                    <li key={ev.id}>
                      <Link to={`/events/${ev.id}/edit`} className="card compact-link-row">
                        {ev.title} · {formatDate(ev.eventDate)} ·{' '}
                        {formatCurrency(getEventRevenueTotal(ev.id, eventValues))}
                      </Link>
                    </li>
                  ))}
                  {customerEngagements.map((e) => (
                    <li key={e.id}>
                      <Link to={`/engagements/${e.id}`} className="card compact-link-row">
                        {e.title} · {e.status === 'active' ? 'פעיל' : 'הסתיים'}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === 'invoices' && (
            <>
              {customerInvoices.length === 0 ? (
                <p className="empty-state empty-state--compact">אין חשבוניות</p>
              ) : (
                <ul className="link-list">
                  {customerInvoices.map((inv) => {
                    const overdue = isInvoiceOverdue(inv);
                    const status = overdue ? 'באיחור' : STATUS_HE[inv.status];
                    return (
                      <li key={inv.id}>
                        <Link to={`/invoices/${inv.id}`} className="card compact-link-row">
                          {formatCurrency(inv.amount)} · {formatDate(inv.issuedAt)} · {status}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {tab === 'tasks' && (
            <>
              {customerTasks.length === 0 ? (
                <p className="empty-state empty-state--compact">אין משימות קשורות</p>
              ) : (
                <ul className="task-list">
                  {customerTasks.map((t) => (
                    <li key={t.id} className={`task-row ${t.done ? 'done' : ''}`}>
                      <span className="task-check">{t.done ? '✓' : '○'}</span>
                      <span>{t.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === 'notes' && (
            <>
              {customerLeads.every((l) => !l.notes.trim()) &&
              customerEvents.every((e) => !e.notes.trim()) ? (
                <p className="empty-state empty-state--compact">אין הערות</p>
              ) : (
                <ul className="notes-list">
                  {customerLeads
                    .filter((l) => l.notes.trim())
                    .map((l) => (
                      <li key={l.id} className="card note-card">
                        <strong>ליד · {formatDate(l.createdAt.slice(0, 10))}</strong>
                        <p>{l.notes}</p>
                      </li>
                    ))}
                  {customerEvents
                    .filter((e) => e.notes.trim())
                    .map((e) => (
                      <li key={e.id} className="card note-card">
                        <strong>
                          {e.title} · {formatDate(e.eventDate)}
                        </strong>
                        <p>{e.notes}</p>
                      </li>
                    ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
