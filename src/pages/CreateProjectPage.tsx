import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { useAppStore } from '../store/useAppStore';

export function CreateProjectPage() {
  const navigate = useNavigate();
  const createEngagement = useAppStore((s) => s.createEngagement);
  const addMilestone = useAppStore((s) => s.addMilestone);

  const [clientName, setClientName] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneAmount, setMilestoneAmount] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !title.trim()) return;

    const id = createEngagement({
      kind: 'project',
      title: title.trim(),
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || undefined,
      startDate,
      endDate: endDate || undefined,
      notes: notes.trim(),
    });

    if (id && milestoneName.trim() && milestoneAmount) {
      addMilestone(id, {
        name: milestoneName.trim(),
        amount: Number(milestoneAmount),
        notes: '',
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
        <h1 className="page-title">ליווי / פרויקט חדש</h1>
        <p className="page-subtitle">אבני דרך עם שם חופשי — אפשר להוסיף עוד אחר כך</p>

        <form onSubmit={handleSubmit} className="card">
          <div className="field">
            <label htmlFor="proj-client">שם לקוח *</label>
            <input
              id="proj-client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="proj-title">שם הפרויקט / הליווי *</label>
            <input
              id="proj-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: שיפוץ דירה / ליווי פיננסי"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="proj-start">תאריך התחלה</label>
            <input
              id="proj-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="proj-end">תאריך סיום (אופציונלי)</label>
            <input
              id="proj-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="proj-email">אימייל לקוח</label>
            <input
              id="proj-email"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="proj-notes">הערות</label>
            <textarea id="proj-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <fieldset className="engagement-fieldset">
            <legend>אבן דרך ראשונה (אופציונלי)</legend>
            <div className="field">
              <label htmlFor="ms-name">שם אבן הדרך</label>
              <input
                id="ms-name"
                value={milestoneName}
                onChange={(e) => setMilestoneName(e.target.value)}
                placeholder="לדוגמה: הדמיות / תוכנית עבודה"
              />
            </div>
            <div className="field">
              <label htmlFor="ms-amount">סכום (₪)</label>
              <input
                id="ms-amount"
                type="number"
                min={0}
                value={milestoneAmount}
                onChange={(e) => setMilestoneAmount(e.target.value)}
              />
            </div>
          </fieldset>

          <button type="submit" className="btn btn-primary">
            צור ליווי
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
