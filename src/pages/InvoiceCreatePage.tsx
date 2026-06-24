import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { getClientName, getEventRevenueTotal } from '../lib/events';
import { useAppStore } from '../store/useAppStore';

export function InvoiceCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const events = useAppStore((s) => s.events);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const createInvoice = useAppStore((s) => s.createInvoice);

  const [pickEventId, setPickEventId] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  useEffect(() => {
    const fromEventId = (location.state as { fromEventId?: string } | null)?.fromEventId;
    if (fromEventId) setPickEventId(fromEventId);
  }, [location.state]);

  useEffect(() => {
    if (!pickEventId) {
      setClientEmail('');
      return;
    }
    const event = events.find((e) => e.id === pickEventId);
    setClientEmail(event?.clientEmail ?? '');
  }, [pickEventId, events]);

  const recentEvents = useMemo(
    () =>
      [...events]
        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
        .slice(0, 20),
    [events],
  );

  const handleCreateFromEvent = () => {
    if (!pickEventId) return;
    const event = events.find((e) => e.id === pickEventId);
    const client = getClientName(pickEventId, categories, eventValues) ?? 'לקוח';
    const amount = getEventRevenueTotal(pickEventId, eventValues);
    const id = createInvoice({
      clientName: client,
      clientEmail: clientEmail.trim() || event?.clientEmail,
      amount,
      eventId: pickEventId,
    });
    if (id) navigate(`/invoices/${id}`);
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/invoices" className="back-link">
          ← חשבוניות
        </Link>
        <h1 className="page-title">הפקת חשבונית</h1>

        <div className="card">
          <div className="field">
            <label htmlFor="inv-event">בחרו אירוע</label>
            <select
              id="inv-event"
              value={pickEventId}
              onChange={(e) => setPickEventId(e.target.value)}
            >
              <option value="">—</option>
              {recentEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} · {new Date(ev.eventDate).toLocaleDateString('he-IL')}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="inv-email">אימייל לקוח</label>
            <input
              id="inv-email"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@example.com"
              autoComplete="email"
            />
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
      </div>
      <BottomNav />
    </div>
  );
}
