import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ClipboardList,
  Layers,
  Ticket,
  Users,
} from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/ui/EmptyState';
import { PillTabs } from '../components/ui/PillTabs';
import { formatCurrency, formatDate } from '../lib/finance';
import {
  ENGAGEMENT_KIND_LABEL,
  nextWeekdayDate,
  packProgress,
} from '../lib/engagements';
import { getClientName, getEventRevenueTotal } from '../lib/events';
import type { Engagement } from '../types/models';
import { useAppStore } from '../store/useAppStore';

type ActivityFilter = 'all' | 'event' | 'session_pack' | 'recurring_group' | 'project';
type ActivityTiming = 'today' | 'upcoming' | 'completed';

interface ActivityItem {
  id: string;
  kind: ActivityFilter;
  timing: ActivityTiming;
  client: string;
  dateLabel: string;
  valueLabel: string;
  typeLabel: string;
  href: string;
  icon: typeof Calendar;
}

const FILTER_TABS: Array<{ id: ActivityFilter; label: string }> = [
  { id: 'all', label: 'הכל' },
  { id: 'event', label: 'אירועים' },
  { id: 'session_pack', label: 'כרטיסיות' },
  { id: 'recurring_group', label: 'חוגים' },
  { id: 'project', label: 'ליווי' },
];

const TIMING_LABEL: Record<ActivityTiming, string> = {
  today: 'היום',
  upcoming: 'קרוב',
  completed: 'הושלם',
};

const KIND_ICON: Record<Exclude<ActivityFilter, 'all'>, typeof Calendar> = {
  event: Calendar,
  session_pack: Ticket,
  recurring_group: Users,
  project: ClipboardList,
};

function eventTiming(eventDate: string, todayIso: string): ActivityTiming {
  if (eventDate === todayIso) return 'today';
  if (eventDate < todayIso) return 'completed';
  return 'upcoming';
}

function engagementItem(e: Engagement, todayIso: string): ActivityItem {
  const { remaining } = packProgress(e);
  const memberCount = e.members?.length ?? 0;
  const nextDate =
    e.kind === 'recurring_group' && e.weekday != null ? nextWeekdayDate(e.weekday) : null;

  let dateLabel = '';
  let valueLabel = '';
  if (e.kind === 'session_pack') {
    dateLabel = e.packExpiresAt ? formatDate(e.packExpiresAt) : 'ללא תוקף';
    valueLabel = `${remaining} מפגשים`;
  } else if (e.kind === 'recurring_group') {
    dateLabel = nextDate ? formatDate(nextDate) : '—';
    valueLabel = `${memberCount} משתתפים`;
  } else {
    dateLabel = e.startDate ? formatDate(e.startDate) : '—';
    valueLabel = e.status === 'active' ? 'פעיל' : 'הסתיים';
  }

  const timing: ActivityTiming =
    e.status !== 'active' ? 'completed' : nextDate === todayIso ? 'today' : 'upcoming';

  return {
    id: e.id,
    kind: e.kind,
    timing,
    client: e.clientName || e.title,
    dateLabel,
    valueLabel,
    typeLabel: ENGAGEMENT_KIND_LABEL[e.kind],
    href: `/engagements/${e.id}`,
    icon: KIND_ICON[e.kind],
  };
}

export function EngagementsPage() {
  const events = useAppStore((s) => s.events);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const engagements = useAppStore((s) => s.engagements ?? []);

  const [filter, setFilter] = useState<ActivityFilter>('all');
  const todayIso = new Date().toISOString().slice(0, 10);

  const items = useMemo(() => {
    const list: ActivityItem[] = [];

    for (const ev of events) {
      const client = getClientName(ev.id, categories, eventValues);
      const amount = getEventRevenueTotal(ev.id, eventValues);
      list.push({
        id: `ev-${ev.id}`,
        kind: 'event',
        timing: eventTiming(ev.eventDate, todayIso),
        client: client ?? 'לקוח',
        dateLabel: formatDate(ev.eventDate),
        valueLabel: amount > 0 ? formatCurrency(amount) : '—',
        typeLabel: 'אירוע',
        href: `/events/${ev.id}/edit`,
        icon: Calendar,
      });
    }

    for (const e of engagements) {
      list.push(engagementItem(e, todayIso));
    }

    return list.sort((a, b) => {
      const order = { today: 0, upcoming: 1, completed: 2 };
      return order[a.timing] - order[b.timing];
    });
  }, [events, categories, eventValues, engagements, todayIso]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.kind === filter);
  }, [items, filter]);

  const activeItems = filtered.filter((i) => i.timing !== 'completed');
  const completedItems = filtered.filter((i) => i.timing === 'completed');

  return (
    <div className="app-shell">
      <div className="page">
        <div className="page-top-row">
          <h1 className="page-title">פעילויות</h1>
          <Link to="/create" className="btn btn-primary btn-sm">
            + חדש
          </Link>
        </div>

        <PillTabs tabs={FILTER_TABS} active={filter} onChange={setFilter} ariaLabel="סינון פעילויות" />

        {filtered.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="אין פעילויות עדיין"
            message="הוסיפו אירוע, כרטיסייה או חוג כדי להתחיל"
            actionLabel="+ פעילות חדשה"
            actionTo="/create"
          />
        ) : (
          <>
            {activeItems.length > 0 && (
              <ul className="activity-list">
                {activeItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <Link to={item.href} className="card activity-card-v2">
                        <span className={`activity-timing activity-timing--${item.timing}`}>
                          {TIMING_LABEL[item.timing]}
                        </span>
                        <div className="activity-card-v2-body">
                          <div className="activity-card-v2-top">
                            <span className="activity-card-v2-icon" aria-hidden>
                              <Icon size={16} strokeWidth={2} />
                            </span>
                            <strong>{item.client}</strong>
                          </div>
                          <p className="activity-card-v2-meta">
                            {item.dateLabel} · {item.valueLabel}
                          </p>
                        </div>
                        <span className="activity-card-v2-type">{item.typeLabel}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {completedItems.length > 0 && (
              <>
                <h2 className="section-title-sm" style={{ marginTop: '1rem' }}>
                  הושלם
                </h2>
                <ul className="activity-list">
                  {completedItems.slice(0, 8).map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <Link to={item.href} className="card activity-card-v2 activity-card-v2--muted">
                          <span className="activity-timing activity-timing--completed">
                            {TIMING_LABEL.completed}
                          </span>
                          <div className="activity-card-v2-body">
                            <div className="activity-card-v2-top">
                              <span className="activity-card-v2-icon" aria-hidden>
                                <Icon size={16} strokeWidth={2} />
                              </span>
                              <strong>{item.client}</strong>
                            </div>
                            <p className="activity-card-v2-meta">{item.typeLabel}</p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
