import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ClipboardList,
  Layers,
  Ticket,
  Users,
} from 'lucide-react';
import { MonthlyExpensesBar } from '../components/MonthlyExpensesBar';
import { BottomNav } from '../components/BottomNav';
import { CollapsibleSection } from '../components/ui/CollapsibleSection';
import { EmptyState } from '../components/ui/EmptyState';
import { PillTabs } from '../components/ui/PillTabs';
import { formatCurrency, formatDate } from '../lib/finance';
import {
  ENGAGEMENT_KIND_LABEL,
  nextWeekdayDate,
  packProgress,
} from '../lib/engagements';
import { getClientName, getEventRevenueTotal } from '../lib/events';
import { externalFormEventBadge } from '../lib/externalForms/badges';
import type { Engagement } from '../types/models';
import { useAppStore } from '../store/useAppStore';

type ActivityFilter = 'all' | 'event' | 'session_pack' | 'recurring_group' | 'project';

interface ActivityItem {
  id: string;
  kind: ActivityFilter;
  client: string;
  dateLabel: string;
  valueLabel: string;
  typeLabel: string;
  formBadge?: string;
  href: string;
  icon: typeof Calendar;
  sortDate: string;
  isEvent: boolean;
  isPast: boolean;
}

const FILTER_TABS: Array<{ id: ActivityFilter; label: string }> = [
  { id: 'all', label: 'הכל' },
  { id: 'event', label: 'אירועים' },
  { id: 'session_pack', label: 'כרטיסיות' },
  { id: 'recurring_group', label: 'חוגים' },
  { id: 'project', label: 'ליווי' },
];

const KIND_ICON: Record<Exclude<ActivityFilter, 'all'>, typeof Calendar> = {
  event: Calendar,
  session_pack: Ticket,
  recurring_group: Users,
  project: ClipboardList,
};

function weekEndIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function engagementItem(e: Engagement): ActivityItem {
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

  return {
    id: e.id,
    kind: e.kind,
    client: e.clientName || e.title,
    dateLabel,
    valueLabel,
    typeLabel: ENGAGEMENT_KIND_LABEL[e.kind],
    href: `/engagements/${e.id}`,
    icon: KIND_ICON[e.kind],
    sortDate: nextDate ?? e.startDate ?? e.createdAt.slice(0, 10),
    isEvent: false,
    isPast: e.status !== 'active',
  };
}

function ActivityCard({ item, highlight }: { item: ActivityItem; highlight?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      className={`card activity-card-v2 ${highlight ? 'activity-card-v2--highlight' : ''} ${item.isPast ? 'activity-card-v2--muted' : ''}`}
    >
      <div className="activity-card-v2-body">
        <div className="activity-card-v2-top">
          <span className="activity-card-v2-icon" aria-hidden>
            <Icon size={16} strokeWidth={2} />
          </span>
          <strong>{item.client}</strong>
        </div>
        <p className="activity-card-v2-meta">
          {item.dateLabel} · {item.valueLabel}
          {item.formBadge && (
            <span className="form-source-chip">{item.formBadge}</span>
          )}
        </p>
      </div>
      <span className="activity-card-v2-type">{item.typeLabel}</span>
    </Link>
  );
}

function ActivityList({ items, highlight }: { items: ActivityItem[]; highlight?: boolean }) {
  if (items.length === 0) return null;
  return (
    <ul className="activity-list">
      {items.map((item) => (
        <li key={item.id}>
          <ActivityCard item={item} highlight={highlight} />
        </li>
      ))}
    </ul>
  );
}

export function EngagementsPage() {
  const events = useAppStore((s) => s.events);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const engagements = useAppStore((s) => s.engagements ?? []);

  const [filter, setFilter] = useState<ActivityFilter>('all');
  const todayIso = new Date().toISOString().slice(0, 10);
  const weekEnd = weekEndIso();

  const sections = useMemo(() => {
    const thisWeekEvents: ActivityItem[] = [];
    const laterEvents: ActivityItem[] = [];
    const pastEvents: ActivityItem[] = [];
    const activeEngagements: ActivityItem[] = [];
    const pastEngagements: ActivityItem[] = [];

    for (const ev of events) {
      const client = getClientName(ev.id, categories, eventValues);
      const amount = getEventRevenueTotal(ev.id, eventValues);
      const item: ActivityItem = {
        id: `ev-${ev.id}`,
        kind: 'event',
        client: client ?? 'לקוח',
        dateLabel: formatDate(ev.eventDate),
        valueLabel: amount > 0 ? formatCurrency(amount) : '—',
        typeLabel: 'אירוע',
        formBadge: externalFormEventBadge(ev) ?? undefined,
        href: `/events/${ev.id}/edit`,
        icon: Calendar,
        sortDate: ev.eventDate,
        isEvent: true,
        isPast: ev.eventDate < todayIso,
      };

      if (ev.eventDate < todayIso) pastEvents.push(item);
      else if (ev.eventDate <= weekEnd) thisWeekEvents.push(item);
      else laterEvents.push(item);
    }

    for (const e of engagements) {
      const item = engagementItem(e);
      if (item.isPast) pastEngagements.push(item);
      else activeEngagements.push(item);
    }

    const byDate = (a: ActivityItem, b: ActivityItem) => a.sortDate.localeCompare(b.sortDate);
    thisWeekEvents.sort(byDate);
    laterEvents.sort(byDate);
    pastEvents.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
    activeEngagements.sort(byDate);
    pastEngagements.sort((a, b) => b.sortDate.localeCompare(a.sortDate));

    return { thisWeekEvents, laterEvents, pastEvents, activeEngagements, pastEngagements };
  }, [events, categories, eventValues, engagements, todayIso, weekEnd]);

  const applyFilter = (items: ActivityItem[]) => {
    if (filter === 'all') return items;
    return items.filter((i) => i.kind === filter);
  };

  const thisWeek = applyFilter(sections.thisWeekEvents);
  const later = applyFilter(sections.laterEvents);
  const pastEvents = applyFilter(sections.pastEvents);
  const activeEng = applyFilter(sections.activeEngagements);
  const pastEng = applyFilter(sections.pastEngagements);
  const past = [...pastEvents, ...pastEng].sort((a, b) => b.sortDate.localeCompare(a.sortDate));

  const totalVisible =
    thisWeek.length + later.length + activeEng.length + past.length;

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

        <MonthlyExpensesBar />

        {totalVisible === 0 ? (
          <EmptyState
            icon={Layers}
            title="אין פעילויות עדיין"
            message="הוסיפו אירוע, כרטיסייה או חוג כדי להתחיל"
            actionLabel="+ פעילות חדשה"
            actionTo="/create"
          />
        ) : (
          <div className="activity-sections">
            {thisWeek.length > 0 && (
              <CollapsibleSection
                title="השבוע הקרוב"
                count={thisWeek.length}
                defaultOpen
                variant="highlight"
              >
                <ActivityList items={thisWeek} highlight />
              </CollapsibleSection>
            )}

            {activeEng.length > 0 && (
              <CollapsibleSection
                title="ליוויים פעילים"
                count={activeEng.length}
                defaultOpen
              >
                <ActivityList items={activeEng} />
              </CollapsibleSection>
            )}

            {later.length > 0 && (
              <CollapsibleSection
                title="אירועים עתידיים"
                count={later.length}
                defaultOpen={false}
              >
                <ActivityList items={later} />
              </CollapsibleSection>
            )}

            {past.length > 0 && (
              <CollapsibleSection
                title="עבר"
                count={past.length}
                defaultOpen={false}
                variant="muted"
              >
                <ActivityList items={past.slice(0, 20)} />
              </CollapsibleSection>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
