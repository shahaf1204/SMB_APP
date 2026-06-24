import { FormEvent, useState } from 'react';
import { Banknote, Calendar, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { FormSection } from '../components/ui/FormSection';
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

        <form onSubmit={handleSubmit} className="form-stack">
          <FormSection title="פרטי לקוח" icon={User}>
            <div className="field">
              <label htmlFor="pack-client">שם לקוח / לקוחה *</label>
              <input id="pack-client" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="pack-email">אימייל</label>
              <input id="pack-email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} dir="ltr" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="pack-phone">טלפון</label>
              <input id="pack-phone" type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} dir="ltr" />
            </div>
          </FormSection>

          <FormSection title="פרטי פעילות" icon={Calendar}>
            <div className="field">
              <label htmlFor="pack-title">שם הכרטיסייה</label>
              <input id="pack-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="10 שיעורי פילאטיס" />
            </div>
            <div className="field">
              <label htmlFor="pack-sessions">מספר כניסות *</label>
              <input id="pack-sessions" type="number" min={1} value={totalSessions} onChange={(e) => setTotalSessions(e.target.value)} required />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="pack-expires">תוקף (אופציונלי)</label>
              <input id="pack-expires" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </FormSection>

          <FormSection title="תשלום" icon={Banknote}>
            <div className="field">
              <label htmlFor="pack-amount">סכום ששולם מראש *</label>
              <input id="pack-amount" type="number" min={0} value={packAmount} onChange={(e) => setPackAmount(e.target.value)} required />
            </div>
            <label className="remember-row" style={{ margin: 0 }}>
              <input type="checkbox" checked={issueInvoice} onChange={(e) => setIssueInvoice(e.target.checked)} />
              <span>הפק חשבונית על הרכישה</span>
            </label>
          </FormSection>

          <button type="submit" className="btn btn-primary form-submit-btn">
            צור כרטיסייה
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
