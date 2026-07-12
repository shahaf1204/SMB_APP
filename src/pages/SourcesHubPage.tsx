import { ChevronLeft, FileInput, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { useCrmSync } from '../hooks/useCrmSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export function SourcesHubPage() {
  const business = useAppStore((s) => s.business)!;
  const connections = useAppStore((s) => s.externalFormConnections).filter(
    (c) => c.businessId === business.id,
  );
  const leads = useAppStore((s) => s.leads);
  const { metaConnection } = useCrmSync();

  const activeForms = connections.filter((c) => c.isActive).length;
  const metaActive = Boolean(metaConnection?.isActive);
  const cloudReady = isSupabaseConfigured();

  const sourceCards = [
    {
      to: '/sources/forms',
      label: 'טפסים',
      desc: 'forms.app — כל מילוי יוצר אירוע ולקוח אוטומטית',
      icon: FileInput,
      status:
        connections.length === 0
          ? 'טרם חובר טופס'
          : `${activeForms} מתוך ${connections.length} פעילים`,
    },
    {
      to: '/sources/leads',
      label: 'לידים',
      desc: 'Meta Lead Ads ו-Google Sheets — פניות מקמפיינים',
      icon: Users,
      status:
        leads.length > 0
          ? `${leads.length} לידים במערכת`
          : metaActive
            ? 'Meta מחובר — ממתין ללידים'
            : cloudReady
              ? 'טרם חובר מקור לידים'
              : 'דורש התחברות לענן',
    },
  ] as const;

  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">מקורות כניסה</h1>
        <p className="page-subtitle">
          חברי טפסים וקמפיינים — כל מקור ייצור אירועים ולקוחות באופן אוטומטי
        </p>

        <ul className="hub-card-list hub-card-list--lg">
          {sourceCards.map(({ to, label, desc, icon: Icon, status }) => (
            <li key={to}>
              <Link to={to} className="hub-card hub-card--lg">
                <span className="hub-card-icon hub-card-icon--lg" aria-hidden>
                  <Icon size={24} strokeWidth={1.75} />
                </span>
                <span className="hub-card-body">
                  <span className="hub-card-title-row">
                    <strong>{label}</strong>
                  </span>
                  <span className="hub-card-desc">{desc}</span>
                  <span className="field-hint">{status}</span>
                </span>
                <ChevronLeft size={20} className="hub-card-chevron" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <p className="field-hint">
          <Link to="/activities">פעילויות</Link> · <Link to="/leads">רשימת לידים</Link> ·{' '}
          <Link to="/customers">לקוחות</Link>
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
