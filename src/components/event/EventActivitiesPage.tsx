import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivitiesPageHeader } from '../activities/ActivitiesPageHeader';
import { ActivitiesPageSkeleton } from '../activities/ActivitiesPageSkeleton';
import { ActivitiesSearchField } from '../activities/ActivitiesSearchField';
import { ActivitiesSection } from '../activities/ActivitiesSection';
import { CreateActivityEmptyAction } from '../create/CreateActivityButton';
import { ActivityCard } from '../business/ActivityCard';
import { BottomNav } from '../BottomNav';
import { EmptyState } from '../ds/EmptyState';
import { PillTabs } from '../ui/PillTabs';
import { useStoreHydration } from '../../hooks/useStoreHydration';
import {
  applyAttentionFlags,
  buildActivityRecords,
  filterActivitiesByChip,
  getActivitiesEmptyIcon,
  getActivitiesFilterChips,
  getActivitiesGroupingConfig,
  getActivitiesPageCopy,
  getActivitiesPrimaryCtaLabel,
  groupActivities,
  mapActivityRecordToCard,
  searchActivityRecords,
  selectFeaturedActivity,
  type ActivityFilterId,
} from '../../lib/activities';
import { useAppStore } from '../../store/useAppStore';
import { EventSummaryRow } from './EventSummaryRow';
import '../../styles/activities-page.css';
import '../../styles/event-workspace.css';

function weekEndIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

/** Event-primary Activities page — one featured ActivityCard + compact EventSummaryRow list */
export function EventActivitiesPage() {
  const hydrated = useStoreHydration();
  const navigate = useNavigate();

  const business = useAppStore((s) => s.business);
  const events = useAppStore((s) => s.events);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const engagements = useAppStore((s) => s.engagements ?? []);
  const milestones = useAppStore((s) => s.milestones ?? []);
  const sessions = useAppStore((s) => s.engagementSessions ?? []);
  const invoices = useAppStore((s) => s.invoices);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const weekEnd = useMemo(() => weekEndIso(), []);

  const groupingConfig = useMemo(() => getActivitiesGroupingConfig(business), [business]);
  const pageCopy = useMemo(() => getActivitiesPageCopy(business), [business]);
  const filterChips = useMemo(() => getActivitiesFilterChips(business), [business]);
  const primaryCta = useMemo(() => getActivitiesPrimaryCtaLabel(business), [business]);
  const emptyIcon = useMemo(() => getActivitiesEmptyIcon(business), [business]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActivityFilterId>('all');

  const allRecords = useMemo(
    () =>
      buildActivityRecords({
        business,
        events,
        engagements,
        categories,
        eventValues,
        milestones,
        sessions,
        invoices,
        todayIso,
      }),
    [business, events, engagements, categories, eventValues, milestones, sessions, invoices, todayIso],
  );

  const withAttention = useMemo(
    () =>
      applyAttentionFlags(allRecords, { todayIso, weekEndIso: weekEnd }, invoices),
    [allRecords, todayIso, weekEnd, invoices],
  );

  const searched = useMemo(
    () => searchActivityRecords(withAttention, searchQuery),
    [withAttention, searchQuery],
  );

  const filtered = useMemo(
    () => filterActivitiesByChip(searched, activeFilter, todayIso, weekEnd),
    [searched, activeFilter, todayIso, weekEnd],
  );

  const featured = useMemo(
    () => selectFeaturedActivity(filtered, todayIso),
    [filtered, todayIso],
  );

  const listRecords = useMemo(
    () => (featured ? filtered.filter((r) => r.id !== featured.id) : filtered),
    [filtered, featured],
  );

  const grouped = useMemo(
    () =>
      groupActivities(listRecords, groupingConfig.groups, {
        todayIso,
        weekEndIso: weekEnd,
        primaryModel: groupingConfig.primaryModel,
      }),
    [listRecords, groupingConfig, todayIso, weekEnd],
  );

  const visibleCount = filtered.length;
  const hasSearchOrFilter = searchQuery.trim().length > 0 || activeFilter !== 'all';
  const showEmptyWorkspace = hydrated && allRecords.length === 0;
  const showNoResults = hydrated && allRecords.length > 0 && visibleCount === 0 && hasSearchOrFilter;
  const showContent = hydrated && visibleCount > 0;

  const featuredCard = featured
    ? mapActivityRecordToCard(featured, 'hero', navigate)
    : null;

  return (
    <div className="app-shell">
      <div className="page page-event-activities">
        {!hydrated ? (
          <ActivitiesPageSkeleton />
        ) : (
          <>
            <ActivitiesPageHeader
              title={pageCopy.title}
              subtitle={pageCopy.subtitle}
              count={allRecords.length > 0 ? visibleCount : undefined}
              ctaLabel={primaryCta}
            />

            {allRecords.length > 0 && (
              <>
                <ActivitiesSearchField value={searchQuery} onChange={setSearchQuery} />

                {filterChips.length > 1 && (
                  <div className="activities-filter-chips">
                    <PillTabs
                      tabs={filterChips}
                      active={activeFilter}
                      onChange={setActiveFilter}
                      ariaLabel="סינון אירועים"
                    />
                  </div>
                )}
              </>
            )}

            {showEmptyWorkspace && (
              <EmptyState
                icon={emptyIcon}
                title={pageCopy.emptyTitle}
                description={pageCopy.emptyDescription}
              >
                <CreateActivityEmptyAction label={pageCopy.emptyCta} />
              </EmptyState>
            )}

            {showNoResults && (
              <p className="activities-search-empty" role="status">
                לא נמצאו אירועים התואמים לחיפוש או לסינון
              </p>
            )}

            {showContent && (
              <div
                className="activities-page-content"
                data-workspace-model="event"
              >
                {featuredCard && (
                  <section className="activities-featured" aria-label="אירוע מומלץ">
                    <span className="activities-featured__label">
                      {featured?.needsAttention ? 'דורש טיפול' : 'הבא בתור'}
                    </span>
                    <ActivityCard {...featuredCard} />
                  </section>
                )}

                {groupingConfig.groups.map((group) => {
                  const items = grouped.get(group.id) ?? [];
                  if (items.length === 0) return null;

                  return (
                    <ActivitiesSection
                      key={group.id}
                      title={group.title}
                      count={items.length}
                      context={group.context}
                      collapsible={group.collapsible}
                      defaultCollapsed={group.defaultCollapsed}
                    >
                      <ul className="event-summary-list">
                        {items.map((record) => (
                          <li key={record.id}>
                            <EventSummaryRow
                              record={record}
                              categories={categories}
                              eventValues={eventValues}
                            />
                          </li>
                        ))}
                      </ul>
                    </ActivitiesSection>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
