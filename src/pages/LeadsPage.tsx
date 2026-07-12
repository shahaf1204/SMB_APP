import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { LeadCard } from '../components/crm/LeadCard';
import { ManualLeadForm } from '../components/crm/ManualLeadForm';
import {
  countByStatStatus,
  LEAD_FILTER_OPTIONS,
  STAT_CARD_LABELS,
  STAT_CARD_STATUSES,
  type LeadFilter,
} from '../lib/crm/constants';
import { importDemoMetaLead } from '../lib/crm/leadsSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { useCrmSync } from '../hooks/useCrmSync';
import { useAppStore } from '../store/useAppStore';

export function LeadsPage() {
  const user = useAppStore((s) => s.user);
  const business = useAppStore((s) => s.business)!;
  const leads = useAppStore((s) => s.leads);
  const addLead = useAppStore((s) => s.addLead);
  const { metaConnection, metaLoading, syncLeads } = useCrmSync();
  const [filter, setFilter] = useState<LeadFilter>('all');

  const isConnected = Boolean(metaConnection?.isActive);
  const cloudReady = isSupabaseConfigured();

  const filtered = useMemo(() => {
    if (filter === 'all') return leads;
    if (filter === 'in_progress') {
      return leads.filter((l) => l.status === 'in_progress' || l.status === 'contacted');
    }
    return leads.filter((l) => l.status === filter);
  }, [leads, filter]);

  const showNoSourceEmpty =
    !metaLoading && !isConnected && leads.length === 0 && !cloudReady;
  const showNoLeadsEmpty = isConnected && leads.length === 0;

  const handleLoadDemo = () => {
    if (!user) return;
    const demo = importDemoMetaLead(business.id, user.id, leads);
    if (demo) addLead(demo);
  };

  return (
    <div className="app-shell">
      <div className="page">
        <div className="page-top-row">
          <div>
            <h1 className="page-title">לידים</h1>
            <p className="page-subtitle">כל הפניות מהקמפיינים והמקורות שלך</p>
          </div>
          <Link to="/sources/leads" className="btn btn-ghost btn-sm">
            מקורות
          </Link>
        </div>

        <section className="card sources-inline-cta">
          <p>
            לידים מגיעים מ-Meta או Google Sheets —{' '}
            <Link to="/sources/leads">הגדרת מקורות לידים</Link>
          </p>
        </section>

        <ManualLeadForm />

        {leads.length > 0 && (
          <>
            <div className="crm-stats-row">
              {STAT_CARD_STATUSES.map((stat) => (
                <div key={stat} className="crm-stat-card">
                  <span className="crm-stat-num">{countByStatStatus(leads, stat)}</span>
                  <span className="crm-stat-label">{STAT_CARD_LABELS[stat]}</span>
                </div>
              ))}
            </div>

            <div className="chip-row crm-filter-row">
              {LEAD_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`chip ${filter === opt.id ? 'active' : ''}`}
                  onClick={() => setFilter(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="crm-lead-list">
              {filtered.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="empty-state">אין לידים בסינון הזה</p>
            )}
          </>
        )}

        {showNoSourceEmpty && (
          <section className="card crm-empty-state">
            <p className="crm-empty-title">אין לידים עדיין</p>
            <p className="crm-empty-desc">
              חברי מקור לידים (Meta או Google Sheets) או הוסיפי ליד ידנית.
            </p>
            <Link to="/sources/leads" className="btn btn-primary btn-sm">
              הגדרת מקורות לידים
            </Link>
            {import.meta.env.DEV && (
              <button type="button" className="btn btn-ghost" onClick={handleLoadDemo}>
                טעינת ליד לדוגמה (פיתוח)
              </button>
            )}
          </section>
        )}

        {showNoLeadsEmpty && (
          <section className="card crm-empty-state">
            <p className="crm-empty-title">אין לידים חדשים עדיין</p>
            <p className="crm-empty-desc">
              ברגע שלקוח ישאיר פרטים בקמפיין, הוא יופיע כאן.
            </p>
            <button type="button" className="btn btn-ghost" onClick={() => void syncLeads()}>
              רענון רשימה
            </button>
          </section>
        )}

        {!showNoSourceEmpty && !showNoLeadsEmpty && leads.length === 0 && !metaLoading && (
          <section className="card crm-empty-state">
            <p className="crm-empty-title">אין לידים להצגה</p>
            <Link to="/sources/leads" className="btn btn-ghost btn-sm">
              הגדרת מקורות
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => void syncLeads()}>
              סנכרון מהענן
            </button>
          </section>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
