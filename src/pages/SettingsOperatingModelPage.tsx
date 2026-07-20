import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { OperatingModelSettings } from '../components/workspace/OperatingModelSettings';
import { useAppStore } from '../store/useAppStore';

export function SettingsOperatingModelPage() {
  const business = useAppStore((s) => s.business)!;

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/settings" className="back-link">
          ← הגדרות
        </Link>
        <h1 className="page-title">צורת העבודה</h1>
        <p className="page-subtitle">{business.name}</p>

        <OperatingModelSettings />
      </div>
      <BottomNav />
    </div>
  );
}
