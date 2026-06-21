import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { LeadContactActions } from '../components/LeadContactActions';
import { CRM_SOURCE_LABELS, LEAD_STATUS_LABELS } from '../lib/crm/constants';
import { formatDate } from '../lib/finance';
import { useAppStore } from '../store/useAppStore';
import type { LeadStatus } from '../types/models';

const STATUS_OPTIONS: LeadStatus[] = [
  'new',
  'in_progress',
  'contacted',
  'proposal_sent',
  'closed',
  'not_relevant',
];

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lead = useAppStore((s) => s.leads.find((l) => l.id === id));
  const setLeadStatus = useAppStore((s) => s.setLeadStatus);
  const updateLead = useAppStore((s) => s.updateLead);
  const addTask = useAppStore((s) => s.addTask);
  const createEngagement = useAppStore((s) => s.createEngagement);
  const [notes, setNotes] = useState(lead?.notes ?? '');

  const statusHistory = useMemo(() => lead?.statusHistory ?? [], [lead]);

  if (!lead) {
    return (
      <div className="app-shell">
        <div className="page">
          <p className="empty-state">הליד לא נמצא</p>
          <Link to="/leads" className="btn btn-primary">
            חזרה ללידים
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const saveNotes = () => updateLead(lead.id, { notes });

  const handleTask = () => {
    addTask(`מעקב: ${lead.name}`, new Date().toISOString().slice(0, 10));
    setLeadStatus(lead.id, 'in_progress', 'נוצרה משימת מעקב');
  };

  const convertToEvent = () => {
    navigate('/events/new', {
      state: {
        prefill: {
          title: lead.serviceInterest || `אירוע — ${lead.name}`,
          notes: lead.notes,
          clientName: lead.name,
          clientPhone: lead.phone,
          clientEmail: lead.email,
        },
        leadId: lead.id,
      },
    });
  };

  const convertToPack = () => {
    navigate('/create/pack', {
      state: { clientName: lead.name, clientPhone: lead.phone, clientEmail: lead.email, leadId: lead.id },
    });
  };

  const convertToProject = () => {
    navigate('/create/project', {
      state: { clientName: lead.name, clientPhone: lead.phone, clientEmail: lead.email, leadId: lead.id },
    });
  };

  const convertToGroup = () => {
    const engagementId = createEngagement({
      kind: 'recurring_group',
      title: lead.serviceInterest || `חוג — ${lead.name}`,
      clientName: lead.name,
      clientPhone: lead.phone,
      clientEmail: lead.email,
      startDate: new Date().toISOString().slice(0, 10),
      notes: lead.notes,
    });
    if (engagementId) {
      updateLead(lead.id, { convertedToClassId: engagementId, status: 'closed' });
      navigate(`/engagements/${engagementId}`);
    }
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/leads" className="crm-back-link">
          ← חזרה ללידים
        </Link>
        <h1 className="page-title">{lead.name}</h1>
        <span className={`crm-status-badge crm-status-${lead.status}`}>
          {LEAD_STATUS_LABELS[lead.status]}
        </span>

        <section className="card" style={{ marginTop: '1rem' }}>
          <h2 className="crm-section-title">פרטי קשר</h2>
          {lead.phone && <p>📞 {lead.phone}</p>}
          {lead.email && <p>✉️ {lead.email}</p>}
          <LeadContactActions name={lead.name} phone={lead.phone} email={lead.email} />
        </section>

        <section className="card" style={{ marginTop: '1rem' }}>
          <h2 className="crm-section-title">מקור</h2>
          <p>{CRM_SOURCE_LABELS[lead.source] ?? lead.source}</p>
          {lead.externalCampaignName && <p>קמפיין: {lead.externalCampaignName}</p>}
          {lead.externalFormName && <p>טופס: {lead.externalFormName}</p>}
          {lead.externalPageName && <p>עמוד: {lead.externalPageName}</p>}
          <p className="crm-lead-date">נכנס: {formatDate(lead.createdAt.slice(0, 10))}</p>
        </section>

        {lead.formAnswers && lead.formAnswers.length > 0 && (
          <section className="card" style={{ marginTop: '1rem' }}>
            <h2 className="crm-section-title">תשובות הטופס</h2>
            <ul className="crm-form-answers">
              {lead.formAnswers.map((a, i) => (
                <li key={i}>
                  <strong>{a.field}:</strong> {a.value}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card" style={{ marginTop: '1rem' }}>
          <h2 className="crm-section-title">סטטוס</h2>
          <div className="field">
            <label htmlFor="lead-status">שינוי סטטוס</label>
            <select
              id="lead-status"
              value={lead.status}
              onChange={(e) => setLeadStatus(lead.id, e.target.value as LeadStatus)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="card" style={{ marginTop: '1rem' }}>
          <h2 className="crm-section-title">הערות פנימיות</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={4}
            placeholder="הערות לעצמך…"
          />
        </section>

        {statusHistory.length > 0 && (
          <section className="card" style={{ marginTop: '1rem' }}>
            <h2 className="crm-section-title">היסטוריית סטטוסים</h2>
            <ul className="crm-history-list">
              {[...statusHistory].reverse().map((h, i) => (
                <li key={i}>
                  {LEAD_STATUS_LABELS[h.status]} · {new Date(h.at).toLocaleString('he-IL')}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card" style={{ marginTop: '1rem' }}>
          <h2 className="crm-section-title">פעולות</h2>
          <div className="crm-actions-grid">
            <button type="button" className="btn btn-ghost" onClick={handleTask}>
              יצירת משימה
            </button>
            <button type="button" className="btn btn-ghost" onClick={convertToEvent}>
              המרה לאירוע
            </button>
            <button type="button" className="btn btn-ghost" onClick={convertToPack}>
              המרה לכרטיסייה
            </button>
            <button type="button" className="btn btn-ghost" onClick={convertToProject}>
              המרה לליווי
            </button>
            <button type="button" className="btn btn-ghost" onClick={convertToGroup}>
              המרה לחוג
            </button>
          </div>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
