import { FormEvent, useState } from 'react';
import { LEAD_SOURCE_OPTIONS } from '../../data/leadSources';
import type { LeadSourceChannel } from '../../types/models';
import { useAppStore } from '../../store/useAppStore';

export function ManualLeadForm() {
  const addLead = useAppStore((s) => s.addLead);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<LeadSourceChannel>('whatsapp');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMsg('יש להזין שם');
      return;
    }
    addLead({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      source,
      notes: notes.trim(),
      externalProvider: 'manual',
    });
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setMsg('הליד נוסף');
    setOpen(false);
  };

  if (!open) {
    return (
      <section className="card crm-meta-card">
        <p className="crm-meta-title">הוספה ידנית</p>
        <p className="crm-meta-desc">
          ליד מוואטסאפ, המלצה, טלפון — כשאין חיבור אוטומטי.
        </p>
        <button type="button" className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setOpen(true)}>
          + ליד חדש
        </button>
      </section>
    );
  }

  return (
    <section className="card crm-meta-card">
      <p className="crm-meta-title">הוספת ליד ידנית</p>
      <form onSubmit={handleSubmit} className="crm-meta-form" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
        <div className="field">
          <label htmlFor="manual-lead-name">שם</label>
          <input id="manual-lead-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="manual-lead-phone">טלפון</label>
          <input id="manual-lead-phone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
        </div>
        <div className="field">
          <label htmlFor="manual-lead-email">אימייל</label>
          <input id="manual-lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
        </div>
        <div className="field">
          <label htmlFor="manual-lead-source">מקור</label>
          <select id="manual-lead-source" value={source} onChange={(e) => setSource(e.target.value as LeadSourceChannel)}>
            {LEAD_SOURCE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="manual-lead-notes">הערות</label>
          <textarea id="manual-lead-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <div className="crm-btn-row">
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
            ביטול
          </button>
          <button type="submit" className="btn btn-primary">
            שמירה
          </button>
        </div>
      </form>
      {msg && <p className="crm-meta-msg">{msg}</p>}
    </section>
  );
}
