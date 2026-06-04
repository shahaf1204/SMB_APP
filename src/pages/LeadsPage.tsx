import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { LeadContactActions } from '../components/LeadContactActions';
import { LEAD_SOURCE_OPTIONS, leadSourceLabel } from '../data/leadSources';
import { useAppStore } from '../store/useAppStore';
import type { LeadSourceChannel, LeadStatus } from '../types/models';

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'חדש',
  contacted: 'יצרתי קשר',
  quoted: 'נשלחה הצעה',
  won: 'נסגר',
  lost: 'לא רלוונטי',
};

export function LeadsPage() {
  const leads = useAppStore((s) => s.leads);
  const addLead = useAppStore((s) => s.addLead);
  const updateLead = useAppStore((s) => s.updateLead);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<LeadSourceChannel>('instagram');
  const [notes, setNotes] = useState('');

  const newLeads = leads.filter((l) => l.status === 'new');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addLead({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      source,
      notes: notes.trim(),
    });
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setShowForm(false);
  };

  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">לידים</h1>
        <p className="page-subtitle">
          פניות מפרסום ברשתות (הזנה ידנית · בהמשך חיבור אוטומטי)
        </p>

        {newLeads.length > 0 && (
          <div className="card alert-card" style={{ marginBottom: '0.75rem' }}>
            <strong>{newLeads.length} לידים חדשים</strong> ממתינים ליצירת קשר
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleSubmit} className="card">
            <div className="field">
              <label htmlFor="lead-name">שם</label>
              <input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="lead-phone">טלפון</label>
              <input id="lead-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="lead-email">אימייל</label>
              <input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="lead-source">מקור</label>
              <select id="lead-source" value={source} onChange={(e) => setSource(e.target.value as LeadSourceChannel)}>
                {LEAD_SOURCE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="lead-notes">הערות</label>
              <textarea id="lead-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">
              שמור ליד
            </button>
            <button type="button" className="btn btn-ghost" style={{ marginTop: '0.5rem' }} onClick={() => setShowForm(false)}>
              ביטול
            </button>
          </form>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            + ליד חדש מפרסום
          </button>
        )}

        <ul className="lead-list" style={{ marginTop: '1rem' }}>
          {leads.length === 0 ? (
            <li className="empty-state">אין לידים עדיין</li>
          ) : (
            leads.map((lead) => (
              <li key={lead.id} className="card lead-card">
                <div className="lead-card-head">
                  <strong>{lead.name}</strong>
                  <span className={`status-pill status-${lead.status === 'new' ? 'today' : 'past'}`}>
                    {STATUS_LABELS[lead.status]}
                  </span>
                </div>
                <p className="lead-meta">
                  {leadSourceLabel(lead.source)} ·{' '}
                  {new Date(lead.createdAt).toLocaleDateString('he-IL')}
                </p>
                {lead.notes && <p className="lead-notes">{lead.notes}</p>}
                <LeadContactActions name={lead.name} phone={lead.phone} email={lead.email} />
                <div className="field" style={{ marginBottom: 0, marginTop: '0.5rem' }}>
                  <label htmlFor={`status-${lead.id}`}>סטטוס</label>
                  <select
                    id={`status-${lead.id}`}
                    value={lead.status}
                    onChange={(e) => updateLead(lead.id, { status: e.target.value as LeadStatus })}
                  >
                    {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <Link to="/events/new" className="lead-link-event" onClick={() => updateLead(lead.id, { status: 'contacted' })}>
                  + צור אירוע מהליד
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
      <BottomNav />
    </div>
  );
}
