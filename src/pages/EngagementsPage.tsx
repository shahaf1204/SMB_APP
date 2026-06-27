import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ClipboardList,
  Layers,
  Ticket,
  Users,
} from 'lucide-react';
import { MonthlyExpensesBar } from '../components/MonthlyExpensesBar';
import { ThisWeekEventsShowcase } from '../components/activities/ThisWeekEventsShowcase';
import { BottomNav } from '../components/BottomNav';import { CollapsibleSection } from '../components/ui/CollapsibleSection';
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
import {
  activityEmptyMessage,
  allowedActivityFilters,
  buildActivityFilterTabs,
  type ActivityFilter,
  usesEngagementActivities,
  usesEventActivities,
} from '../lib/workModel';
import type { Engagement, Event } from '../types/models';
import { useAppStore } from '../store/useAppStore';
interface ActivityItem {
  id: string;
  kind: ActivityFilter;
  client: string;
  title: string;
  location?: string;
  dateLabel: string;
  valueLabel: string;
  typeLabel: string;
  formBadge?: string;
  href: string;
  icon: typeof Calendar;
  sortDate: string;
  isEvent: boolean;
  isPast: boolean;
  event?: Event;
}

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
    title: e.title,
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
  const business = useAppStore((s) => s.business);
  const events = useAppStore((s) => s.events);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const engagements = useAppStore((s) => s.engagements ?? []);

  const allowedKinds = useMemo(() => allowedActivityFilters(business), [business]);
  const filterTabs = useMemo(() => buildActivityFilterTabs(business), [business]);
  const showEventSections = usesEventActivities(business);
  const showEngagementSections = usesEngagementActivities(business);

  const [filter, setFilter] = useState<ActivityFilter>('all');
  const todayIso = new Date().toISOString().slice(0, 10);
  const weekEnd = weekEndIso();

  useEffect(() => {
    if (filter !== 'all' && !allowedKinds.has(filter)) {
      setFilter('all');
    }
  }, [filter, allowedKinds]);

  const sections = useMemo(() => {
    const thisWeekEvents: ActivityItem[] = [];
    const laterEvents: ActivityItem[] = [];
    const pastEvents: ActivityItem[] = [];
    const activeEngagements: ActivityItem[] = [];
    const pastEngagements: ActivityItem[] = [];

    if (allowedKinds.has('event')) {
      for (const ev of events) {
        const client = getClientName(ev.id, categories, eventValues);
        const amount = getEventRevenueTotal(ev.id, eventValues);
        const item: ActivityItem = {
          id: `ev-${ev.id}`,
          kind: 'event',
          client: client ?? 'לקוח',
          title: ev.title,
          location: ev.location.trim() || undefined,
          dateLabel: formatDate(ev.eventDate),
          valueLabel: amount > 0 ? formatCurrency(amount) : '—',
          typeLabel: 'אירוע',
          formBadge: externalFormEventBadge(ev) ?? undefined,
          href: `/events/${ev.id}/edit`,
          icon: Calendar,
          sortDate: ev.eventDate,
          isEvent: true,
          isPast: ev.eventDate < todayIso,
          event: ev,
        };

        if (ev.eventDate < todayIso) pastEvents.push(item);
        else if (ev.eventDate <= weekEnd) thisWeekEvents.push(item);
        else laterEvents.push(item);
      }
    }

    for (const e of engagements) {
      if (!allowedKinds.has(e.kind)) continue;
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
  }, [events, categories, eventValues, engagements, todayIso, weekEnd, allowedKinds]);

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

  const showWeekShowcase =
    showEventSections &&
    thisWeek.length > 0 &&
    (filter === 'all' || filter === 'event');

  const weekShowcaseItems = thisWeek.map((item) => ({
    id: item.id,
    href: item.href,
    sortDate: item.sortDate,
    client: item.client,
    title: item.title,
    location: item.location,
    dateLabel: item.dateLabel,
    valueLabel: item.valueLabel,
    formBadge: item.formBadge,
    event: item.event,
  }));

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

        {filterTabs.length > 0 && (
          <PillTabs
            tabs={filterTabs}
            active={filter}
            onChange={setFilter}
            ariaLabel="סינון פעילויות"
          />
        )}

        <MonthlyExpensesBar />

        {totalVisible === 0 ? (
          <EmptyState
            icon={Layers}
            title="אין פעילויות עדיין"
            message={activityEmptyMessage(business)}
            actionLabel="+ פעילות חדשה"
            actionTo="/create"
          />
        ) : (
          <div className="activity-sections">
            {showWeekShowcase && (
              <ThisWeekEventsShowcase items={weekShowcaseItems} todayIso={todayIso} />
            )}

            {showEngagementSections && activeEng.length > 0 && (
              <CollapsibleSection
                title="ליוויים פעילים"
                count={activeEng.length}
              >
                <ActivityList items={activeEng} />
              </CollapsibleSection>
            )}

            {showEventSections && later.length > 0 && (
              <CollapsibleSection
                title="אירועים עתידיים"
                count={later.length}
              >
                <ActivityList items={later} />
              </CollapsibleSection>
            )}

            {past.length > 0 && (
              <CollapsibleSection
                title="עבר"
                count={past.length}
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
