import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { useAppStore } from '../store/useAppStore';

export function CreatePackPage() {
  const navigate = useNavigate();
  const createEngagement = useAppStore((s) => s.createEngagement);
  const createInvoice = useAppStore((s) => s.createInvoice);

  const [clientName, setClientName] = useState('');
  const [title, setTitle] = useState('');
  const [totalSessions, setTotalSessions] = useState('10');
  const [packAmount, setPackAmount] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [issueInvoice, setIssueInvoice] = useState(true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !totalSessions || !packAmount) return;

    const id = createEngagement({
      kind: 'session_pack',
      title: title.trim() || `כרטיסייה — ${clientName.trim()}`,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      startDate: new Date().toISOString().slice(0, 10),
      packExpiresAt: expiresAt || undefined,
      totalSessions: Number(totalSessions),
      packAmount: Number(packAmount),
      notes: '',
    });

    if (id && issueInvoice && Number(packAmount) > 0) {
      createInvoice({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        amount: Number(packAmount),
        engagementId: id,
        notes: title.trim() || 'רכישת כרטיסייה',
      });
    }

    if (id) navigate(`/engagements/${id}`);
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/create" className="page-back">
          ← חזרה
        </Link>
        <h1 className="page-title">כרטיסייה חדשה</h1>
        <p className="page-subtitle">תשלום מראש + מונה כניסות</p>

        <form onSubmit={handleSubmit} className="card">
          <div className="field">
            <label htmlFor="pack-client">שם לקוח / לקוחה *</label>
            <input
              id="pack-client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="pack-title">שם הכרטיסייה</label>
            <input
              id="pack-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: 10 שיעורי פילאטיס"
            />
          </div>
          <div className="field">
            <label htmlFor="pack-sessions">מספר כניסות *</label>
            <input
              id="pack-sessions"
              type="number"
              min={1}
              value={totalSessions}
              onChange={(e) => setTotalSessions(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="pack-amount">סכום ששולם מראש *</label>
            <input
              id="pack-amount"
              type="number"
              min={0}
              value={packAmount}
              onChange={(e) => setPackAmount(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="pack-email">אימייל (לחשבונית)</label>
            <input
              id="pack-email"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="pack-phone">טלפון</label>
            <input
              id="pack-phone"
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="pack-expires">תוקף (אופציונלי)</label>
            <input
              id="pack-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <label className="remember-row">
            <input
              type="checkbox"
              checked={issueInvoice}
              onChange={(e) => setIssueInvoice(e.target.checked)}
            />
            <span>הפק חשבונית על הרכישה</span>
          </label>
          <button type="submit" className="btn btn-primary">
            צור כרטיסייה
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
