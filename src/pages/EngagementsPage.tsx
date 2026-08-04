import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ClipboardList,
  Layers,
  Ticket,
  Users,
} from 'lucide-react';
import { ThisWeekEventsShowcase } from '../components/activities/ThisWeekEventsShowcase';
import { CreateActivityButton, CreateActivityEmptyAction } from '../components/create/CreateActivityButton';
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
import { engagementRevenueAmount } from '../lib/finance/engagementFinancialSync';
import type { Engagement, Event, Milestone } from '../types/models';
import { externalFormEventBadge } from '../lib/externalForms/badges';
import { getUnreadAutoActivityIds } from '../lib/externalForms/formActivityNotification';
import {
  activityEmptyMessage,
  allowedActivityFilters,
  buildActivityFilterTabs,
  type ActivityFilter,
  usesEngagementActivities,
  usesEventActivities,
} from '../lib/workModel';
import { useActivitiesWorkspace } from '../hooks/useActivitiesWorkspace';
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

function engagementItem(
  e: Engagement,
  milestones: Milestone[],
  eventValues: ReturnType<typeof useAppStore.getState>['eventValues'],
): ActivityItem {
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
    const amount =
      (e.eventId ? getEventRevenueTotal(e.eventId, eventValues) : 0) ||
      engagementRevenueAmount(e, milestones);
    valueLabel = amount > 0 ? formatCurrency(amount) : e.status === 'active' ? 'פעיל' : 'הסתיים';
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

function ActivityCard({
  item,
  highlight,
  isNewAuto,
}: {
  item: ActivityItem;
  highlight?: boolean;
  isNewAuto?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      className={`card activity-card-v2 ${highlight ? 'activity-card-v2--highlight' : ''} ${isNewAuto ? 'activity-card-v2--new-auto' : ''} ${item.isPast ? 'activity-card-v2--muted' : ''}`}
    >
      <div className="activity-card-v2-body">
        <div className="activity-card-v2-top">
          <span className="activity-card-v2-icon" aria-hidden>
            <Icon size={16} strokeWidth={2} />
          </span>
          <strong>{item.client}</strong>
          {isNewAuto && <span className="activity-new-badge">חדש</span>}
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

function ActivityList({
  items,
  highlight,
  newAutoIds,
}: {
  items: ActivityItem[];
  highlight?: boolean;
  newAutoIds?: Set<string>;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="activity-list">
      {items.map((item) => (
        <li key={item.id}>
          <ActivityCard
            item={item}
            highlight={highlight}
            isNewAuto={newAutoIds?.has(item.event?.id ?? item.id.replace(/^ev-/, ''))}
          />
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
  const milestones = useAppStore((s) => s.milestones ?? []);
  const formNotifications = useAppStore((s) => s.formNotifications);

  const activitiesWorkspace = useActivitiesWorkspace();

  const newAutoEventIds = useMemo(
    () => getUnreadAutoActivityIds(formNotifications),
    [formNotifications],
  );

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
      const item = engagementItem(e, milestones, eventValues);
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
  }, [events, categories, eventValues, engagements, milestones, todayIso, weekEnd, allowedKinds]);

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
          <div>
            <h1 className="page-title">{activitiesWorkspace.terminology.activityPlural}</h1>
            <p className="page-subtitle page-subtitle--inline">
              {activitiesWorkspace.primaryOperatingModel === 'hybrid'
                ? 'אירועים, ליוויים ופרויקטים'
                : `ניהול ${activitiesWorkspace.terminology.activityPlural.toLowerCase()}`}
            </p>
          </div>
          <div className="wizard-btn-row">
            <Link to="/sources" className="btn btn-ghost btn-sm">
              מקורות
            </Link>
            <CreateActivityButton label="+ חדש" />
          </div>
        </div>

        {filterTabs.length > 0 && (
          <PillTabs
            tabs={filterTabs}
            active={filter}
            onChange={setFilter}
            ariaLabel="סינון פעילויות"
          />
        )}

        {totalVisible === 0 ? (
          <EmptyState
            icon={Layers}
            title="אין פעילויות עדיין"
            message={activityEmptyMessage(business)}
          >
            <CreateActivityEmptyAction />
          </EmptyState>
        ) : (
          <div
            className="activity-sections"
            data-workspace-model={activitiesWorkspace.primaryOperatingModel}
            data-workspace-grouping={activitiesWorkspace.groupingMode}
            data-card-presentation={activitiesWorkspace.defaultCardPresentation}
            data-workspace-filters={activitiesWorkspace.filterTabs.map((t) => t.id).join(',')}
          >
            {showWeekShowcase && (
              <ThisWeekEventsShowcase
                items={weekShowcaseItems}
                todayIso={todayIso}
                newAutoEventIds={newAutoEventIds}
              />
            )}

            {showEngagementSections && activeEng.length > 0 && (
              <CollapsibleSection
                title="ליוויים פעילים"
                count={activeEng.length}
              >
                <ActivityList items={activeEng} newAutoIds={newAutoEventIds} />
              </CollapsibleSection>
            )}

            {showEventSections && later.length > 0 && (
              <CollapsibleSection
                title="אירועים עתידיים"
                count={later.length}
              >
                <ActivityList items={later} newAutoIds={newAutoEventIds} />
              </CollapsibleSection>
            )}

            {past.length > 0 && (
              <CollapsibleSection
                title="עבר"
                count={past.length}
                variant="muted"
              >
                <ActivityList items={past.slice(0, 20)} newAutoIds={newAutoEventIds} />
              </CollapsibleSection>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
