import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { WorkModelSettings } from '../components/WorkModelSettings';
import { useAppStore } from '../store/useAppStore';

export function SettingsBusinessPage() {
  const eventTemplates = useAppStore((s) => s.eventTemplates);
  const addEventTemplate = useAppStore((s) => s.addEventTemplate);
  const deleteEventTemplate = useAppStore((s) => s.deleteEventTemplate);

  const [tplName, setTplName] = useState('');
  const [tplTitle, setTplTitle] = useState('');
  const [showTplForm, setShowTplForm] = useState(false);

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
        <Link to="/settings" className="back-link">
          ← הגדרות
        </Link>
        <h1 className="page-title">העסק שלי</h1>

        <WorkModelSettings />

        <nav className="settings-links card" style={{ marginTop: '0.75rem' }}>
          <Link to="/categories" className="settings-link-row">
            <span>📋</span>
            <span>ניהול קטגוריות</span>
          </Link>
        </nav>

        <section className="card" style={{ marginTop: '0.75rem' }}>
          <h2 className="section-title-sm">תבניות אירוע</h2>
          {eventTemplates.length === 0 && !showTplForm && (
            <p className="empty-state" style={{ padding: '0.25rem 0' }}>
              אין תבניות
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
                />
              </div>
              <div className="field">
                <label htmlFor="tpl-title">כותרת ברירת מחדל</label>
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
      </div>
      <BottomNav />
    </div>
  );
}
