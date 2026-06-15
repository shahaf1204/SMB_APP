import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { formatCurrency } from '../lib/finance';
import {
  ENGAGEMENT_KIND_LABEL,
  engagementRevenueTotal,
  engagementSessionsFor,
  memberLabel,
  packProgress,
  WEEKDAY_LABELS,
} from '../lib/engagements';
import { invoiceMailtoHref } from '../lib/invoices';
import { useAppStore } from '../store/useAppStore';
import type { MilestoneStatus } from '../types/models';

const MS_STATUS: Record<MilestoneStatus, string> = {
  pending: 'ממתין',
  done: 'הושלם',
  paid: 'שולם',
};

export function EngagementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business)!;
  const engagement = useAppStore((s) => s.engagements.find((e) => e.id === id));
  const milestones = useAppStore((s) => s.milestones.filter((m) => m.engagementId === id));
  const allSessions = useAppStore((s) => s.engagementSessions);
  const invoices = useAppStore((s) => s.invoices);

  const logEngagementSession = useAppStore((s) => s.logEngagementSession);
  const addMilestone = useAppStore((s) => s.addMilestone);
  const updateMilestone = useAppStore((s) => s.updateMilestone);
  const deleteMilestone = useAppStore((s) => s.deleteMilestone);
  const createMilestoneInvoice = useAppStore((s) => s.createMilestoneInvoice);
  const addGroupMember = useAppStore((s) => s.addGroupMember);
  const removeGroupMember = useAppStore((s) => s.removeGroupMember);
  const completeEngagement = useAppStore((s) => s.completeEngagement);
  const createEngagement = useAppStore((s) => s.createEngagement);
  const createInvoice = useAppStore((s) => s.createInvoice);

  const sessions = useMemo(
    () => (id ? engagementSessionsFor(id, allSessions) : []),
    [id, allSessions],
  );

  const [msName, setMsName] = useState('');
  const [msAmount, setMsAmount] = useState('');
  const [newStudent, setNewStudent] = useState('');
  const [newParent, setNewParent] = useState('');
  const [attended, setAttended] = useState<Set<string>>(new Set());
  const [sessionNotes, setSessionNotes] = useState('');

  if (!engagement) {
    return (
      <div className="page">
        <p>לא נמצא</p>
        <Link to="/engagements">חזרה</Link>
      </div>
    );
  }

  const pack = engagement.kind === 'session_pack' ? packProgress(engagement) : null;
  const sessionRevenue = engagementRevenueTotal(engagement.id, allSessions);
  const milestonePaid = milestones
    .filter((m) => m.status === 'paid')
    .reduce((s, m) => s + m.amount, 0);
  const milestonePending = milestones
    .filter((m) => m.status !== 'paid')
    .reduce((s, m) => s + m.amount, 0);

  const handleLogPackVisit = () => {
    if (pack && pack.remaining <= 0) return;
    logEngagementSession(engagement.id, {
      date: new Date().toISOString().slice(0, 10),
      notes: sessionNotes.trim() || 'כניסה',
      revenue: 0,
    });
    setSessionNotes('');
  };

  const handleLogProjectSession = () => {
    logEngagementSession(engagement.id, {
      date: new Date().toISOString().slice(0, 10),
      notes: sessionNotes.trim() || 'מפגש',
      revenue: 0,
    });
    setSessionNotes('');
  };

  const handleLogGroupLesson = () => {
    const count = attended.size;
    const price = engagement.pricePerStudent ?? 0;
    logEngagementSession(engagement.id, {
      date: new Date().toISOString().slice(0, 10),
      notes: sessionNotes.trim() || `שיעור — ${count} נוכחים`,
      revenue: price * count,
      attendedMemberIds: [...attended],
    });
    setAttended(new Set());
    setSessionNotes('');
  };

  const handleAddMilestone = (e: FormEvent) => {
    e.preventDefault();
    if (!msName.trim() || !msAmount) return;
    addMilestone(engagement.id, {
      name: msName.trim(),
      amount: Number(msAmount),
      notes: '',
    });
    setMsName('');
    setMsAmount('');
  };

  const handleRenewPack = () => {
    const total = engagement.totalSessions ?? 10;
    const amount = engagement.packAmount ?? 0;
    const newId = createEngagement({
      kind: 'session_pack',
      title: `${engagement.title} (חידוש)`,
      clientName: engagement.clientName,
      clientEmail: engagement.clientEmail,
      clientPhone: engagement.clientPhone,
      startDate: new Date().toISOString().slice(0, 10),
      packExpiresAt: engagement.packExpiresAt,
      totalSessions: total,
      packAmount: amount,
      notes: '',
    });
    if (newId && amount > 0) {
      createInvoice({
        clientName: engagement.clientName,
        clientEmail: engagement.clientEmail,
        amount,
        engagementId: newId,
        notes: 'חידוש כרטיסייה',
      });
    }
    completeEngagement(engagement.id);
    navigate(`/engagements/${newId}`);
  };

  const toggleAttended = (memberId: string) => {
    setAttended((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/engagements" className="page-back">
          ← כל הליוויים
        </Link>

        <div className="engagement-header">
          <span className="engagement-kind-badge">{ENGAGEMENT_KIND_LABEL[engagement.kind]}</span>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>
            {engagement.title}
          </h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            {engagement.clientName}
            {engagement.kind === 'recurring_group' && engagement.weekday != null && (
              <> · כל {WEEKDAY_LABELS[engagement.weekday]}</>
            )}
          </p>
        </div>

        {engagement.kind === 'session_pack' && pack && (
          <section className="card engagement-hero">
            <div className="pack-meter-wrap">
              <div
                className="pack-meter-fill"
                style={{ width: `${pack.total ? (pack.used / pack.total) * 100 : 0}%` }}
              />
            </div>
            <p className="pack-meter-label">
              <strong>{pack.remaining}</strong> מתוך {pack.total} כניסות נותרו
            </p>
            {engagement.packAmount != null && (
              <p className="field-hint">שולם: {formatCurrency(engagement.packAmount)}</p>
            )}
            {pack.remaining > 0 ? (
              <>
                <button type="button" className="btn btn-primary" onClick={handleLogPackVisit}>
                  ✓ רשמתי כניסה
                </button>
                <div className="field" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                  <input
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="הערה (אופציונלי)"
                  />
                </div>
              </>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleRenewPack}>
                + כרטיסייה חדשה (חידוש)
              </button>
            )}
          </section>
        )}

        {engagement.kind === 'project' && (
          <>
            <section className="card engagement-summary-row">
              <div>
                <span className="summary-label">שולם</span>
                <strong>{formatCurrency(milestonePaid)}</strong>
              </div>
              <div>
                <span className="summary-label">ממתין</span>
                <strong>{formatCurrency(milestonePending)}</strong>
              </div>
              <div>
                <span className="summary-label">מפגשים</span>
                <strong>{sessions.length}</strong>
              </div>
            </section>

            <section className="card">
              <h2 className="section-title">אבני דרך</h2>
              {milestones.length === 0 && (
                <p className="empty-state">טרם הוגדרו אבני דרך</p>
              )}
              <ul className="milestone-list">
                {milestones.map((m) => {
                  const inv = m.invoiceId
                    ? invoices.find((i) => i.id === m.invoiceId)
                    : undefined;
                  const mailto =
                    inv && engagement.clientEmail
                      ? invoiceMailtoHref(inv, business, [])
                      : null;
                  return (
                    <li key={m.id} className="milestone-item">
                      <div className="milestone-item-head">
                        <strong>{m.name}</strong>
                        <span className={`status-pill status-${m.status === 'paid' ? 'past' : 'today'}`}>
                          {MS_STATUS[m.status]}
                        </span>
                      </div>
                      <p className="milestone-item-meta">
                        {formatCurrency(m.amount)}
                        {m.dueDate && ` · יעד ${new Date(m.dueDate).toLocaleDateString('he-IL')}`}
                      </p>
                      <div className="milestone-actions">
                        {m.status === 'pending' && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => updateMilestone(m.id, { status: 'done' })}
                          >
                            סימון הושלם
                          </button>
                        )}
                        {!m.invoiceId && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              const invId = createMilestoneInvoice(m.id);
                              if (invId) navigate(`/invoices/${invId}`);
                            }}
                          >
                            הפק חשבונית
                          </button>
                        )}
                        {inv && mailto && (
                          <a href={mailto} className="btn btn-ghost btn-sm">
                            שליחה במייל
                          </a>
                        )}
                        {m.status === 'done' && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => updateMilestone(m.id, { status: 'paid' })}
                          >
                            סימון שולם
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-error)' }}
                          onClick={() => deleteMilestone(m.id)}
                        >
                          מחק
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <form onSubmit={handleAddMilestone} className="milestone-add-form">
                <div className="field">
                  <label htmlFor="new-ms-name">שם אבן דרך</label>
                  <input
                    id="new-ms-name"
                    value={msName}
                    onChange={(e) => setMsName(e.target.value)}
                    placeholder="שם חופשי — לפי הסיכום עם הלקוח"
                  />
                </div>
                <div className="field">
                  <label htmlFor="new-ms-amount">סכום (₪)</label>
                  <input
                    id="new-ms-amount"
                    type="number"
                    min={0}
                    value={msAmount}
                    onChange={(e) => setMsAmount(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  + הוספת אבן דרך
                </button>
              </form>
            </section>

            <section className="card">
              <h2 className="section-title">מפגשים</h2>
              <button type="button" className="btn btn-primary" onClick={handleLogProjectSession}>
                + רשמתי מפגש
              </button>
            </section>
          </>
        )}

        {engagement.kind === 'recurring_group' && (
          <>
            <section className="card">
              <h2 className="section-title">
                תלמידים ({engagement.members?.length ?? 0})
              </h2>
              <ul className="member-list">
                {(engagement.members ?? []).map((m) => (
                  <li key={m.id} className="member-row">
                    <span>{memberLabel(m)}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeGroupMember(engagement.id, m.id)}
                    >
                      הסר
                    </button>
                  </li>
                ))}
              </ul>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newStudent.trim()) return;
                  addGroupMember(engagement.id, {
                    studentName: newStudent.trim(),
                    parentName: newParent.trim() || undefined,
                  });
                  setNewStudent('');
                  setNewParent('');
                }}
                className="member-add-form"
              >
                <div className="field">
                  <input
                    value={newStudent}
                    onChange={(e) => setNewStudent(e.target.value)}
                    placeholder="שם תלמיד/ה"
                  />
                </div>
                <div className="field">
                  <input
                    value={newParent}
                    onChange={(e) => setNewParent(e.target.value)}
                    placeholder="שם הורה (אופציונלי)"
                  />
                </div>
                <button type="submit" className="btn btn-ghost">
                  + תלמיד/ה
                </button>
              </form>
            </section>

            <section className="card">
              <h2 className="section-title">רישום שיעור היום</h2>
              {(engagement.members ?? []).length === 0 ? (
                <p className="empty-state">הוסיפו תלמידים קודם</p>
              ) : (
                <>
                  <ul className="attendance-list">
                    {(engagement.members ?? []).map((m) => (
                      <li key={m.id}>
                        <label className="remember-row">
                          <input
                            type="checkbox"
                            checked={attended.has(m.id)}
                            onChange={() => toggleAttended(m.id)}
                          />
                          <span>{memberLabel(m)}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <p className="field-hint">
                    {attended.size} נוכחים ·{' '}
                    {formatCurrency((engagement.pricePerStudent ?? 0) * attended.size)} לשיעור
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={attended.size === 0}
                    onClick={handleLogGroupLesson}
                  >
                    ✓ רשמתי שיעור
                  </button>
                </>
              )}
              <p className="field-hint" style={{ marginTop: '0.75rem' }}>
                סה״כ הכנסות מהחוג: {formatCurrency(sessionRevenue)}
              </p>
            </section>
          </>
        )}

        {sessions.length > 0 && (
          <section className="card">
            <h2 className="section-title">היסטוריה</h2>
            <ul className="session-history">
              {sessions.slice(0, 15).map((s) => (
                <li key={s.id}>
                  <span>{new Date(s.date).toLocaleDateString('he-IL')}</span>
                  <span>{s.notes}</span>
                  {s.revenue > 0 && <span>{formatCurrency(s.revenue)}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {engagement.status === 'active' && engagement.kind !== 'session_pack' && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: '0.5rem' }}
            onClick={() => completeEngagement(engagement.id)}
          >
            סימון כהסתיים
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
