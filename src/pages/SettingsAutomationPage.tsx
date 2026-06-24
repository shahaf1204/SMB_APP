import { Link } from 'react-router-dom';
import { AiSettingsForm } from '../components/AiSettingsForm';
import { BottomNav } from '../components/BottomNav';
import { CalendarReminderSettings } from '../components/CalendarReminderSettings';

export function SettingsAutomationPage() {
  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/settings" className="back-link">
          ← הגדרות
        </Link>
        <h1 className="page-title">אוטומציות</h1>

        <section className="card">
          <h2 className="section-title-sm">עוזר AI</h2>
          <Link
            to="/assistant"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '0.75rem', display: 'block', textAlign: 'center', textDecoration: 'none' }}
          >
            פתיחת העוזר
          </Link>
          <AiSettingsForm compact />
        </section>

        <section className="card" style={{ marginTop: '0.75rem' }}>
          <h2 className="section-title-sm">יומן ותזכורות</h2>
          <CalendarReminderSettings />
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
