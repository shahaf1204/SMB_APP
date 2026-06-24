import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { formatCurrency, formatDate } from '../lib/finance';
import {
  activeEngagements,
  ENGAGEMENT_KIND_ICON,
  ENGAGEMENT_KIND_LABEL,
  nextWeekdayDate,
  packProgress,
} from '../lib/engagements';
import { getClientName, getEventRevenueTotal } from '../lib/events';
import type { Engagement, Event } from '../types/models';
import { useAppStore } from '../store/useAppStore';

function EventActivityRow({ event, client, amount }: { event: Event; client: string | null; amount: number }) {
  return (
    <Link to={`/events/${event.id}/edit`} className="card activity-card">
      <span className="activity-card-icon" aria-hidden>📅</span>
      <div className="activity-card-body">
        <strong>{client ?? 'לקוח'}</strong>
        <p className="activity-card-meta">
          {formatDate(event.eventDate)}
          {amount > 0 && <> · {formatCurrency(amount)}</>}
        </p>
      </div>
      <span className="activity-card-type">אירוע</span>
    </Link>
  );
}

function EngagementActivityRow({ engagement }: { engagement: Engagement }) {
  const { remaining } = packProgress(engagement);
  const memberCount = engagement.members?.length ?? 0;
  const nextDate =
    engagement.kind === 'recurring_group' && engagement.weekday != null
      ? nextWeekdayDate(engagement.weekday)
      : null;

  let meta = '';
  if (engagement.kind === 'session_pack') {
    meta = `${remaining} מפגשים · ${engagement.packExpiresAt ? formatDate(engagement.packExpiresAt) : 'ללא תוקף'}`;
  } else if (engagement.kind === 'recurring_group') {
    meta = `${memberCount} משתתפים${nextDate ? ` · הבא: ${formatDate(nextDate)}` : ''}`;
  } else {
    meta = engagement.startDate ? formatDate(engagement.startDate) : '';
  }

  return (
    <Link to={`/engagements/${engagement.id}`} className="card activity-card">
      <span className="activity-card-icon" aria-hidden>
        {ENGAGEMENT_KIND_ICON[engagement.kind]}
      </span>
      <div className="activity-card-body">
        <strong>{engagement.clientName || engagement.title}</strong>
        <p className="activity-card-meta">{meta}</p>
      </div>
      <span className="activity-card-type">{ENGAGEMENT_KIND_LABEL[engagement.kind]}</span>
    </Link>
  );
}

export function EngagementsPage() {
  const events = useAppStore((s) => s.events);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const engagements = useAppStore((s) => s.engagements ?? []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => new Date(e.eventDate) >= today)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
        .slice(0, 15),
    [events],
  );

  const active = activeEngagements(engagements);
  const completed = engagements.filter((e) => e.status !== 'active');

  return (
    <div className="app-shell">
      <div className="page">
        <div className="page-top-row">
          <h1 className="page-title">פעילויות</h1>
          <Link to="/create" className="btn btn-primary btn-sm">
            + חדש
          </Link>
        </div>

        {upcomingEvents.length === 0 && active.length === 0 ? (
          <p className="empty-state">אין פעילויות — התחילו מ«+ חדש»</p>
        ) : (
          <ul className="activity-list">
            {upcomingEvents.map((ev) => (
              <li key={`ev-${ev.id}`}>
                <EventActivityRow
                  event={ev}
                  client={getClientName(ev.id, categories, eventValues)}
                  amount={getEventRevenueTotal(ev.id, eventValues)}
                />
              </li>
            ))}
            {active.map((e) => (
              <li key={e.id}>
                <EngagementActivityRow engagement={e} />
              </li>
            ))}
          </ul>
        )}

        {completed.length > 0 && (
          <>
            <h2 className="section-title-sm" style={{ marginTop: '1rem' }}>
              הסתיים
            </h2>
            <ul className="activity-list">
              {completed.slice(0, 8).map((e) => (
                <li key={e.id}>
                  <Link to={`/engagements/${e.id}`} className="card activity-card muted">
                    <span className="activity-card-icon">{ENGAGEMENT_KIND_ICON[e.kind]}</span>
                    <div className="activity-card-body">
                      <strong>{e.clientName || e.title}</strong>
                      <p className="activity-card-meta">{ENGAGEMENT_KIND_LABEL[e.kind]}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
