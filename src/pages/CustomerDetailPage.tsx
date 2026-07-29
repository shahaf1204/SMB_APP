import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { CreateActivityButton } from '../components/create/CreateActivityButton';
import { Avatar } from '../components/ui/Avatar';
import { PillTabs } from '../components/ui/PillTabs';
import { buildCustomerSummaries, findCustomerByParamKey } from '../lib/customers';
import { formatCurrency, formatDate } from '../lib/finance';
import { getEventRevenueTotal } from '../lib/events';
import { isInvoiceOverdue } from '../lib/invoices';
import { getCatalogEntry } from '../integrations/catalog';
import { FormSourceChip } from '../components/externalForms/FormSourceChip';
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
    return findCustomerByParamKey(all, key);
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

  const outstandingBalance = useMemo(
    () =>
      customerInvoices
        .filter((i) => i.status !== 'paid')
        .reduce((sum, i) => sum + i.amount, 0),
    [customerInvoices],
  );

  const paidInvoices = useMemo(
    () => customerInvoices.filter((i) => i.status === 'paid'),
    [customerInvoices],
  );

  const upcomingActivities = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return customerEvents
      .filter((e) => e.eventDate >= today)
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  }, [customerEvents]);

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

        <div className="kpi-row kpi-row--client kpi-row--4">
          <div className="kpi-card kpi-card--revenue">
            <span className="kpi-card-label">הכנסות</span>
            <span className="kpi-card-value">{formatCurrency(customer.totalRevenue)}</span>
          </div>
          <div className="kpi-card kpi-card--danger">
            <span className="kpi-card-label">יתרה לגבייה</span>
            <span className="kpi-card-value">{formatCurrency(outstandingBalance)}</span>
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

        <div className="page-top-row" style={{ marginBottom: '0.75rem' }}>
          <PillTabs tabs={TABS} active={tab} onChange={setTab} ariaLabel="טאבי לקוח" />
          {tab === 'activities' && (
            <CreateActivityButton label="הוספת פעילות" className="btn btn-primary btn-sm" />
          )}
        </div>

        <div className="client-tab-panel">
          {tab === 'activities' && (
            <>
              {upcomingActivities.length > 0 && (
                <>
                  <h3 className="section-title-sm">קרובות</h3>
                  <ul className="link-list" style={{ marginBottom: '1rem' }}>
                    {upcomingActivities.map((ev) => (
                      <li key={ev.id}>
                        <Link to={`/events/${ev.id}/edit`} className="card compact-link-row">
                          <span className="compact-link-row-main">
                            {ev.title} · {formatDate(ev.eventDate)} ·{' '}
                            {formatCurrency(getEventRevenueTotal(ev.id, eventValues))}
                          </span>
                          <FormSourceChip event={ev} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {customerEvents.length === 0 && customerEngagements.length === 0 ? (
                <p className="empty-state empty-state--compact">אין פעילויות ללקוח זה</p>
              ) : (
                <ul className="link-list">
                  {customerEvents
                    .filter((ev) => !upcomingActivities.some((u) => u.id === ev.id))
                    .map((ev) => (
                    <li key={ev.id}>
                      <Link to={`/events/${ev.id}/edit`} className="card compact-link-row">
                        <span className="compact-link-row-main">
                          {ev.title} · {formatDate(ev.eventDate)} ·{' '}
                          {formatCurrency(getEventRevenueTotal(ev.id, eventValues))}
                        </span>
                        <FormSourceChip event={ev} />
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
                <>
                  {paidInvoices.length > 0 && (
                    <>
                      <h3 className="section-title-sm">היסטוריית תשלומים</h3>
                      <ul className="link-list" style={{ marginBottom: '1rem' }}>
                        {paidInvoices.map((inv) => (
                          <li key={`paid-${inv.id}`}>
                            <Link to={`/invoices/${inv.id}`} className="card compact-link-row">
                              {formatCurrency(inv.amount)} · {formatDate(inv.issuedAt)} · שולם
                              {(inv.externalProvider ?? inv.provider) && (
                                <> · {getCatalogEntry(inv.externalProvider ?? inv.provider!)?.nameHe ?? inv.externalProvider ?? inv.provider}</>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <h3 className="section-title-sm">כל החשבוניות</h3>
                  <ul className="link-list">
                  {customerInvoices.map((inv) => {
                    const overdue = isInvoiceOverdue(inv);
                    const status = overdue ? 'באיחור' : STATUS_HE[inv.status];
                    return (
                      <li key={inv.id}>
                        <Link to={`/invoices/${inv.id}`} className="card compact-link-row">
                          {formatCurrency(inv.amount)} · {formatDate(inv.issuedAt)} · {status}
                          {inv.paymentUrl && inv.status !== 'paid' && ' · קישור תשלום'}
                        </Link>
                      </li>
                    );
                  })}
                  </ul>
                </>
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
