import { FormEvent, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WorkModelSettings } from '../components/WorkModelSettings';
import { AiSettingsForm } from '../components/AiSettingsForm';
import { BottomNav } from '../components/BottomNav';
import { CalendarReminderSettings } from '../components/CalendarReminderSettings';
import { getAppSnapshot } from '../lib/appSnapshot';
import { downloadBackup, parseBackup } from '../lib/backup';
import {
  downloadEventImportTemplate,
  parseEventsCsv,
  type HistoricalEventRow,
} from '../lib/historicalImport';
import { downloadPeriodReport } from '../lib/report';
import { flushCloudPush, cloudSignOut } from '../lib/cloudSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import type { PeriodFilter } from '../types/models';

export function SettingsPage() {
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business)!;
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const eventTemplates = useAppStore((s) => s.eventTemplates);
  const events = useAppStore((s) => s.events);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const addEventTemplate = useAppStore((s) => s.addEventTemplate);
  const deleteEventTemplate = useAppStore((s) => s.deleteEventTemplate);
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
  const [reportPeriod, setReportPeriod] = useState<PeriodFilter>('thisMonth');
  const [tplName, setTplName] = useState('');
  const [tplTitle, setTplTitle] = useState('');
  const [showTplForm, setShowTplForm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    const message = isSupabaseConfigured()
      ? 'להתנתק? הנתונים נשמרים בענן — אפשר להתחבר שוב עם אותו אימייל וסיסמה.'
      : 'להתנתק? כדי לחזור תצטרכ/י להתחבר שוב מאותו מכשיר.';
    if (!window.confirm(message)) return;

    setLoggingOut(true);
    try {
      if (isSupabaseConfigured()) {
        await flushCloudPush();
        await cloudSignOut();
      }
      logout();
      navigate('/auth', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

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

  const handleAddTemplate = (e: FormEvent) => {
    e.preventDefault();
    if (!tplName.trim() || !tplTitle.trim()) return;
    addEventTemplate({
      name: tplName.trim(),
      title: tplTitle.trim(),
      location: '',
      notes: '',
      categoryDefaults: {},
    });
    setTplName('');
    setTplTitle('');
    setShowTplForm(false);
  };

  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">הגדרות</h1>
        <p className="page-subtitle">{business.name}</p>

        <WorkModelSettings />

        <section className="card" style={{ marginTop: '1rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>עוזר AI</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 0.75rem' }}>
            עוזר חינמי מובנה באפליקציה. אפשר לחבר מודל בתשלום (מפתח שלכם) לשיחה חכמה יותר.
          </p>
          <Link to="/assistant" className="btn btn-primary" style={{ width: '100%', marginBottom: '0.75rem', display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            פתיחת העוזר
          </Link>
          <AiSettingsForm compact />
        </section>

        <section className="card" style={{ marginTop: '1rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>יומן ותזכורות</h2>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)',
              margin: '0 0 0.75rem',
            }}
          >
            שמירה ליומן האישי בעת הוספת/עריכת אירוע, ותזכורות בדפדפן.
          </p>
          <CalendarReminderSettings />
        </section>

        <nav className="settings-links card">
          <Link to="/categories" className="settings-link-row">
            <span>📋</span>
            <span>ניהול קטגוריות</span>
          </Link>
          <Link to="/customers" className="settings-link-row">
            <span>👥</span>
            <span>לקוחות</span>
          </Link>
        </nav>

        <section className="card" style={{ marginTop: '1rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>תבניות אירוע</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 0.5rem' }}>
            מילוי מהיר בעת הוספת אירוע חדש
          </p>
          {eventTemplates.length === 0 && !showTplForm && (
            <p className="empty-state" style={{ padding: '0.25rem 0' }}>
              אין תבניות עדיין
            </p>
          )}
          <ul className="template-list">
            {eventTemplates.map((t) => (
              <li key={t.id} className="template-row">
                <span>{t.name}</span>
                <button
                  type="button"
                  className="chip"
                  onClick={() => deleteEventTemplate(t.id)}
                >
                  מחק
                </button>
              </li>
            ))}
          </ul>
          {showTplForm ? (
            <form onSubmit={handleAddTemplate} style={{ marginTop: '0.5rem' }}>
              <div className="field">
                <label htmlFor="tpl-name">שם תבנית</label>
                <input
                  id="tpl-name"
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder="לדוגמה: חתונה"
                />
              </div>
              <div className="field">
                <label htmlFor="tpl-title">כותרת אירוע ברירת מחדל</label>
                <input
                  id="tpl-title"
                  value={tplTitle}
                  onChange={(e) => setTplTitle(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  שמור
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowTplForm(false)}
                >
                  ביטול
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginTop: '0.5rem' }}
              onClick={() => setShowTplForm(true)}
            >
              + תבנית חדשה
            </button>
          )}
        </section>

        <section className="card import-section" style={{ marginTop: '1rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>ייבוא נתוני עבר</h2>
          <p className="import-section-desc">
            העלו קובץ CSV מ-Excel או Google Sheets — האירועים יתווספו לנתונים הקיימים (לא ימחקו).
            כך תראו בדשבורד את התמונה המלאה מהיום הראשון.
          </p>
          <ol className="import-steps">
            <li>הורידו את התבנית ומלאו את האירועים מהעבר</li>
            <li>ב-Excel: שמירה בשם CSV (מפרידים: פסיק)</li>
            <li>העלו את הקובץ ובדקו תצוגה מקדימה</li>
          </ol>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', marginBottom: '0.5rem' }}
            onClick={downloadEventImportTemplate}
          >
            הורדת תבנית CSV לאירועים
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
                setCsvImportMsg(
                  `נמצאו ${result.rows.length} אירועים לייבוא` +
                    (result.warnings.length ? ` · ${result.warnings.length} אזהרות` : ''),
                );
              };
              reader.readAsText(file, 'UTF-8');
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '0.5rem' }}
            onClick={() => csvRef.current?.click()}
          >
            בחירת קובץ CSV לייבוא
          </button>
          {csvPreview && (
            <div className="import-preview">
              <p style={{ margin: '0 0 0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                דוגמה מהקובץ:
              </p>
              <ul className="import-preview-list">
                {csvPreview.rows.slice(0, 3).map((r, i) => (
                  <li key={i}>
                    {r.eventDate} · {r.title}
                    {r.revenue != null ? ` · הכנסה ${r.revenue}` : ''}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={() => {
                  if (
                    !window.confirm(
                      `לייבא ${csvPreview.rows.length} אירועים לעסק? הנתונים הקיימים יישמרו.`,
                    )
                  ) {
                    return;
                  }
                  ensureCustomerSourceCategory();
                  const n = importHistoricalEvents(csvPreview.rows);
                  setCsvPreview(null);
                  setCsvImportMsg(`יובאו בהצלחה ${n} אירועים. בדקו את הדשבורד והיומן.`);
                }}
              >
                אישור ייבוא {csvPreview.rows.length} אירועים
              </button>
              <button
                type="button"
                className="chip"
                style={{ marginTop: '0.35rem' }}
                onClick={() => {
                  setCsvPreview(null);
                  setCsvImportMsg(null);
                }}
              >
                ביטול
              </button>
            </div>
          )}
          {csvImportMsg && (
            <p className="import-feedback">{csvImportMsg}</p>
          )}
          <p className="import-section-note">
            עמודות נתמכות: תאריך, שם אירוע, לקוח, הכנסות, הוצאות, מיקום, הערות, מקור הגעה.
            לידים וחשבוניות — בשלב הבא או ידנית.
          </p>
        </section>

        <section className="card" style={{ marginTop: '1rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>גיבוי ושחזור</h2>
          <p className="backup-info">
            {isSupabaseConfigured() ? (
              <>
                הנתונים שלך נשמרים <strong>אוטומטית בענן</strong> — גם אם תחליפי מכשיר,
                תנקי דפדפן או תיכנסי מטלפון אחר. עותק מקומי נשמר במקביל לעבודה מהירה.
              </>
            ) : (
              <>
                הנתונים שלך (אירועים, לידים, חשבוניות, כרטיסיות וכו׳) נשמרים{' '}
                <strong>במכשיר הזה</strong> — בדפדפן. הם לא עולים לענן אוטומטית.
                אם תנקי נתוני דפדפן, תחליפי מחשב או תפתחי ממכשיר אחר — הנתונים לא יעברו
                איתך, אלא אם הורדת גיבוי.
              </>
            )}
          </p>
          {!isSupabaseConfigured() && (
            <p className="backup-info backup-info-tip">
              💡 מומלץ: הורידי גיבוי JSON לפחות פעם בשבוע, או אחרי יום עבודה חשוב.
              שמרי את הקובץ ב-Google Drive, iCloud או במחשב.
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginBottom: '0.5rem', width: '100%' }}
            onClick={() => downloadBackup(getAppSnapshot(), business.name)}
          >
            הורדת גיבוי (JSON)
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
            שחזור מקובץ גיבוי
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: '0.5rem', color: 'var(--color-error)' }}
            onClick={() => {
              if (!window.confirm('למחוק את כל הנתונים המקומיים ולהתחיל מחדש?')) return;
              window.location.href = '/?reset=1';
            }}
          >
            איפוס מלא (מחיקת כל הנתונים במכשיר)
          </button>
          {importMsg && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>{importMsg}</p>
          )}
        </section>

        <section className="card" style={{ marginTop: '1rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>חשבון</h2>
          {user?.email && (
            <p
              style={{
                margin: '0 0 0.75rem',
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              מחובר/ת כ-<strong>{user.displayName}</strong>
              {user.email ? ` · ${user.email}` : ''}
            </p>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%' }}
            disabled={loggingOut}
            onClick={() => void handleLogout()}
          >
            {loggingOut ? 'מתנתק/ת…' : 'התנתקות'}
          </button>
        </section>

        <section className="card" style={{ marginTop: '1rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>דוח תקופה (CSV)</h2>
          <div className="field">
            <label htmlFor="report-period">תקופה</label>
            <select
              id="report-period"
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value as PeriodFilter)}
            >
              <option value="thisMonth">החודש הנוכחי</option>
              <option value="lastMonth">חודש שעבר</option>
              <option value="last30">30 יום אחרונים</option>
              <option value="ytd">מתחילת השנה</option>
              <option value="allTime">כל הזמנים</option>
            </select>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() =>
              downloadPeriodReport(events, eventValues, categories, reportPeriod, business.name)
            }
          >
            הורדת דוח CSV
          </button>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
