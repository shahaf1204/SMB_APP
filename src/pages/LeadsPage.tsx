import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { LeadContactActions } from '../components/LeadContactActions';
import { LEAD_SOURCE_OPTIONS, leadSourceLabel } from '../data/leadSources';
import {
  loadLeadSheetSettings,
  saveLeadSheetSettings,
  type LeadSheetSettings,
} from '../lib/leadSheetSettings';
import { resolveSheetSettingsFromInput, syncLeadsFromGoogleSheet } from '../lib/leadSheetSync';
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
  const [showSyncSetup, setShowSyncSetup] = useState(false);
  const [sheetSettings, setSheetSettings] = useState<LeadSheetSettings>(() => loadLeadSheetSettings());
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<LeadSourceChannel>('instagram');
  const [notes, setNotes] = useState('');

  const newLeads = leads.filter((l) => l.status === 'new');

  useEffect(() => {
    setSheetSettings(loadLeadSheetSettings());
  }, []);

  const handleSaveSheetSettings = (e: FormEvent) => {
    e.preventDefault();
    const resolved = resolveSheetSettingsFromInput(sheetSettings.sheetInput);
    if (!resolved.sheetId) {
      setSyncMsg('לא נמצא מזהה גיליון — הדביקי קישור מלא ל-Google Sheets');
      return;
    }
    const next = { ...sheetSettings, ...resolved };
    saveLeadSheetSettings(next);
    setSheetSettings(next);
    setSyncMsg('הגדרות הגיליון נשמרו');
  };

  const handleSyncNow = async () => {
    const settings = loadLeadSheetSettings();
    if (!settings.sheetId) {
      setSyncMsg('קודם הגדירי גיליון Google Sheets');
      setShowSyncSetup(true);
      return;
    }
    setSyncing(true);
    setSyncMsg(null);
    const result = await syncLeadsFromGoogleSheet(
      (lead) => addLead(lead),
      useAppStore.getState().leads,
      settings,
    );
    setSyncing(false);
    setSheetSettings(loadLeadSheetSettings());
    if (!result.ok) {
      setSyncMsg(result.error);
      return;
    }
    if (result.imported === 0) {
      setSyncMsg(`אין לידים חדשים (${result.skipped} כבר ידועים)`);
      return;
    }
    setSyncMsg(`יובאו ${result.imported} לידים חדשים`);
  };

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
          סנכרון אוטומטי מ-Google Sheets — מתאים ללידים מאינסטagram Lead Ads ולאתר
        </p>

        <section className="card lead-sync-card">
          <div className="lead-sync-head">
            <div>
              <h2 style={{ margin: 0, fontSize: '0.95rem' }}>ייבוא אוטומטי (חינם)</h2>
              <p className="field-hint" style={{ margin: '0.25rem 0 0' }}>
                {sheetSettings.sheetId
                  ? sheetSettings.autoSync
                    ? 'סנכרון פעיל — לידים חדשים נכנסים בפתיחת האפליקציה'
                    : 'גיליון מוגדר — סנכרון ידני בלבד'
                  : 'טרם הוגדר גיליון'}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowSyncSetup((v) => !v)}
            >
              {showSyncSetup ? 'סגור הגדרות' : 'הגדרה'}
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={syncing}
            onClick={() => void handleSyncNow()}
          >
            {syncing ? 'מסנכרן…' : 'סנכרון עכשיו'}
          </button>

          {syncMsg && (
            <p className="lead-sync-msg" role="status">
              {syncMsg}
            </p>
          )}

          {showSyncSetup && (
            <form onSubmit={handleSaveSheetSettings} className="lead-sync-setup">
              <ol className="lead-sync-steps">
                <li>
                  <strong>אינסטagram / פייסבוק Lead Ads:</strong> Meta Business Suite →
                  טפסי לידים → חיבור ל-Google Sheets (חינם)
                </li>
                <li>
                  <strong>אתר:</strong> Google Forms / טופס ששומר ל-Google Sheets
                </li>
                <li>
                  שתפי את הגיליון: <em>כל מי שיש לו את הקישור — צופה</em>
                </li>
                <li>הדביקי את הקישור למטה ושמרי</li>
              </ol>
              <div className="field">
                <label htmlFor="sheet-url">קישור ל-Google Sheets</label>
                <input
                  id="sheet-url"
                  type="url"
                  value={sheetSettings.sheetInput}
                  onChange={(e) =>
                    setSheetSettings((s) => ({ ...s, sheetInput: e.target.value }))
                  }
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
              </div>
              <label className="remember-row">
                <input
                  type="checkbox"
                  checked={sheetSettings.autoSync}
                  onChange={(e) =>
                    setSheetSettings((s) => ({ ...s, autoSync: e.target.checked }))
                  }
                />
                <span>סנכרון אוטומטי בפתיחת האפליקציה</span>
              </label>
              <button type="submit" className="btn btn-primary">
                שמירת הגדרות
              </button>
              {sheetSettings.lastSyncAt && (
                <p className="field-hint" style={{ margin: '0.5rem 0 0' }}>
                  סנכרון אחרון:{' '}
                  {new Date(sheetSettings.lastSyncAt).toLocaleString('he-IL')}
                </p>
              )}
            </form>
          )}
        </section>

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
