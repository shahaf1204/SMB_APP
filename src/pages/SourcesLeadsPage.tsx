import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { LeadSheetSyncCard } from '../components/crm/LeadSheetSyncCard';
import { MetaConnectionCard } from '../components/crm/MetaConnectionCard';
import { useCrmSync } from '../hooks/useCrmSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export function SourcesLeadsPage() {
  const user = useAppStore((s) => s.user);
  const business = useAppStore((s) => s.business)!;
  const leads = useAppStore((s) => s.leads);
  const { metaConnection, metaLoading, refreshMeta } = useCrmSync();
  const cloudReady = isSupabaseConfigured();

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/sources" className="back-link">
          ← מקורות כניסה
        </Link>
        <h1 className="page-title">מקורות לידים</h1>
        <p className="page-subtitle">
          חברי Meta או Google Sheets — לידים חדשים יופיעו ב{' '}
          <Link to="/leads">רשימת הלידים</Link>
        </p>

        <LeadSheetSyncCard />

        {cloudReady && user && (
          <MetaConnectionCard
            connection={metaConnection}
            loading={metaLoading}
            userId={user.id}
            businessId={business.id}
            onUpdated={() => void refreshMeta()}
          />
        )}

        {!cloudReady && (
          <section className="card crm-meta-card">
            <p className="crm-meta-title">ענן לא מחובר</p>
            <p className="crm-meta-desc">
              לקליטה אוטומטית מ-Meta יש להתחבר עם אימייל וסיסמה (Supabase).
            </p>
          </section>
        )}

        {leads.length > 0 && (
          <section className="card">
            <p className="field-hint">
              {leads.length} לידים במערכת —{' '}
              <Link to="/leads" className="form-notification-link">
                צפייה ברשימה
              </Link>
            </p>
          </section>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
