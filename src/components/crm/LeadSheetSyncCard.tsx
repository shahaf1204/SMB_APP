import { FormEvent, useState } from 'react';
import {
  loadLeadSheetSettings,
  saveLeadSheetSettings,
  type LeadSheetSettings,
} from '../../lib/leadSheetSettings';
import { resolveSheetSettingsFromInput, syncLeadsFromGoogleSheet } from '../../lib/leadSheetSync';
import { useAppStore } from '../../store/useAppStore';

export function LeadSheetSyncCard() {
  const addLead = useAppStore((s) => s.addLead);
  const leads = useAppStore((s) => s.leads);
  const [settings, setSettings] = useState<LeadSheetSettings>(() => loadLeadSheetSettings());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const persist = (next: LeadSheetSettings) => {
    setSettings(next);
    saveLeadSheetSettings(next);
  };

  const handleSaveUrl = (e: FormEvent) => {
    e.preventDefault();
    const resolved = resolveSheetSettingsFromInput(settings.sheetInput);
    if (!resolved.sheetId) {
      setMsg('לא זיהינו קישור תקין ל-Google Sheets');
      return;
    }
    persist({ ...settings, ...resolved });
    setMsg('קישור לגיליון נשמר');
  };

  const handleSync = async () => {
    const resolved = resolveSheetSettingsFromInput(settings.sheetInput);
    if (!resolved.sheetId) {
      setMsg('יש להזין קישור לגיליון לפני סנכרון');
      return;
    }
    const toSave = { ...settings, ...resolved };
    persist(toSave);
    setBusy(true);
    setMsg(null);
    const result = await syncLeadsFromGoogleSheet(
      (lead) =>
        addLead({
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          source: lead.source,
          notes: lead.notes,
          createdAt: lead.createdAt,
          externalProvider: 'sheet',
        }),
      useAppStore.getState().leads,
      toSave,
    );
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    persist(loadLeadSheetSettings());
    setMsg(`יובאו ${result.imported} לידים · דולגו ${result.skipped} · סה״כ ${result.totalRows} שורות`);
  };

  return (
    <section className="card crm-meta-card">
      <p className="crm-meta-title">לידים מ-Google Sheets</p>
      <p className="crm-meta-desc">
        חברי גיליון (למשל ייצוא מ-Meta Lead Ads או Zapier). לידים חדשים ייכנסו אוטומטית בפתיחת
        האפליקציה.
      </p>
      <form onSubmit={handleSaveUrl} className="crm-meta-form" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
        <div className="field">
          <label htmlFor="lead-sheet-url">קישור לגיליון</label>
          <input
            id="lead-sheet-url"
            value={settings.sheetInput}
            onChange={(e) => setSettings((s) => ({ ...s, sheetInput: e.target.value }))}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            dir="ltr"
          />
        </div>
        <label className="crm-check-row">
          <input
            type="checkbox"
            checked={settings.autoSync}
            onChange={(e) => persist({ ...settings, autoSync: e.target.checked })}
          />
          סנכרון אוטומטי בפתיחת האפליקציה
        </label>
        {settings.lastSyncAt && (
          <p className="crm-meta-hint" style={{ marginTop: '0.35rem' }}>
            סנכרון אחרון: {new Date(settings.lastSyncAt).toLocaleString('he-IL')}
          </p>
        )}
        <div className="crm-btn-row">
          <button type="submit" className="btn btn-ghost" disabled={busy}>
            שמירת קישור
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void handleSync()}>
            {busy ? 'מסנכרן…' : 'סנכרון עכשיו'}
          </button>
        </div>
      </form>
      {msg && <p className="crm-meta-msg">{msg}</p>}
      <p className="crm-meta-webhook">
        עמודות נתמכות: שם, טלפון, אימייל, תאריך, פלטפורמה. הגיליון חייב להיות «Anyone with the link
        can view».
      </p>
      {leads.filter((l) => l.externalProvider === 'sheet').length > 0 && (
        <p className="crm-meta-hint">
          {leads.filter((l) => l.externalProvider === 'sheet').length} לידים מהגיליון
        </p>
      )}
    </section>
  );
}
