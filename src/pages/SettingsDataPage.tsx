import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { getAppSnapshot } from '../lib/appSnapshot';
import { downloadBackup, parseBackup } from '../lib/backup';
import {
  downloadEventImportTemplate,
  parseEventsCsv,
  type HistoricalEventRow,
} from '../lib/historicalImport';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export function SettingsDataPage() {
  const business = useAppStore((s) => s.business)!;
  const restoreAppState = useAppStore((s) => s.restoreAppState);
  const importHistoricalEvents = useAppStore((s) => s.importHistoricalEvents);
  const ensureCustomerSourceCategory = useAppStore((s) => s.ensureCustomerSourceCategory);

  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<{
    rows: HistoricalEventRow[];
    warnings: string[];
  } | null>(null);
  const [csvImportMsg, setCsvImportMsg] = useState<string | null>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseBackup(String(reader.result));
      if (!result.ok) {
        setImportMsg(result.error);
        return;
      }
      if (!window.confirm('ייבוא יחליף את כל הנתונים הנוכחיים. להמשיך?')) return;
      restoreAppState(result.data);
      setImportMsg('הגיבוי שוחזר בהצלחה');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/settings" className="back-link">
          ← הגדרות
        </Link>
        <h1 className="page-title">נתונים</h1>

        <section className="card import-section">
          <h2 className="section-title-sm">ייבוא נתוני עבר</h2>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', marginBottom: '0.5rem' }}
            onClick={downloadEventImportTemplate}
          >
            הורדת תבנית CSV
          </button>
          <input
            ref={csvRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const result = parseEventsCsv(String(reader.result));
                if (!result.ok) {
                  setCsvPreview(null);
                  setCsvImportMsg(result.error);
                  return;
                }
                setCsvPreview({ rows: result.rows, warnings: result.warnings });
                setCsvImportMsg(`נמצאו ${result.rows.length} אירועים`);
              };
              reader.readAsText(file, 'UTF-8');
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => csvRef.current?.click()}
          >
            בחירת קובץ CSV
          </button>
          {csvPreview && (
            <div className="import-preview" style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  if (!window.confirm(`לייבא ${csvPreview.rows.length} אירועים?`)) return;
                  ensureCustomerSourceCategory();
                  const n = importHistoricalEvents(csvPreview.rows);
                  setCsvPreview(null);
                  setCsvImportMsg(`יובאו ${n} אירועים`);
                }}
              >
                אישור ייבוא {csvPreview.rows.length}
              </button>
            </div>
          )}
          {csvImportMsg && <p className="import-feedback">{csvImportMsg}</p>}
        </section>

        <section className="card" style={{ marginTop: '0.75rem' }}>
          <h2 className="section-title-sm">גיבוי ושחזור</h2>
          <p className="backup-info" style={{ fontSize: '0.8rem' }}>
            {isSupabaseConfigured()
              ? 'הנתונים נשמרים אוטומטית בענן.'
              : 'הנתונים נשמרים במכשיר — מומלץ גיבוי שבועי.'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '0.5rem' }}
            onClick={() => downloadBackup(getAppSnapshot(), business.name)}
          >
            הורדת גיבוי JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImport}
          />
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%' }}
            onClick={() => fileRef.current?.click()}
          >
            שחזור מקובץ
          </button>
          {importMsg && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>{importMsg}</p>
          )}
        </section>

        <Link to="/invoices/reports" className="btn btn-ghost" style={{ width: '100%', marginTop: '0.75rem', display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          דוחות ויצוא CSV
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
