import { useEffect, useState } from 'react';
import { clearAppStorage } from '../lib/safeStorage';

export function LoadingScreen() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 2000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className="page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        color: 'var(--color-text-secondary)',
        gap: '0.75rem',
        padding: '1rem',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0 }}>טוען…</p>
      {slow && (
        <div style={{ fontSize: '0.85rem', maxWidth: 300 }}>
          <p style={{ margin: '0 0 0.5rem' }}>
            הטעינה אורכת יותר מדי — לרוב אחרי ייבוא גדול או נתונים פגומים בדפדפן.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              clearAppStorage();
              window.location.reload();
            }}
          >
            איפוס נתונים מקומיים ורענון
          </button>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem' }}>
            מוחק נתונים שמורים במכשיר. אם יש גיבוי JSON — שחזרו מההגדרות אחרי הכניסה.
          </p>
        </div>
      )}
    </div>
  );
}
