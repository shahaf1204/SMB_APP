import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TicketCheck } from 'lucide-react';
import { ActivitiesPageHeader } from '../activities/ActivitiesPageHeader';
import { ActivitiesPageSkeleton } from '../activities/ActivitiesPageSkeleton';
import { ActivitiesSearchField } from '../activities/ActivitiesSearchField';
import { CreateActivityEmptyAction } from '../create/CreateActivityButton';
import { BottomNav } from '../BottomNav';
import { EmptyState } from '../ds/EmptyState';
import { PillTabs } from '../ui/PillTabs';
import { useStoreHydration } from '../../hooks/useStoreHydration';
import {
  buildPackageClientGroups,
  filterPackageClientGroups,
  PACKAGE_ACTIVITIES_FILTERS,
  PACKAGE_ACTIVITIES_PAGE_COPY,
  searchPackageClientGroups,
  type PackageActivitiesFilterId,
} from '../../lib/package/packageClientList';
import { resolvePackageDashboardConfig } from '../../lib/package/resolvePackageDashboardConfig';
import { useAppStore } from '../../store/useAppStore';
import { PackageClientRow } from './PackageClientRow';
import '../../styles/package-workspace.css';

const VALID_FILTERS = new Set<string>(PACKAGE_ACTIVITIES_FILTERS.map((f) => f.id));

function parseFilterParam(value: string | null): PackageActivitiesFilterId {
  if (value && VALID_FILTERS.has(value)) {
    return value as PackageActivitiesFilterId;
  }
  return 'all';
}

/** Package-primary Activities page — client-first compact list */
export function PackageActivitiesPage() {
  const hydrated = useStoreHydration();
  const [searchParams, setSearchParams] = useSearchParams();

  const business = useAppStore((s) => s.business);
  const engagements = useAppStore((s) => s.engagements ?? []);
  const sessions = useAppStore((s) => s.engagementSessions ?? []);
  const invoices = useAppStore((s) => s.invoices ?? []);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const config = useMemo(() => resolvePackageDashboardConfig(business), [business]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<PackageActivitiesFilterId>(() =>
    parseFilterParam(searchParams.get('filter')),
  );

  useEffect(() => {
    const fromUrl = parseFilterParam(searchParams.get('filter'));
    setActiveFilter(fromUrl);
  }, [searchParams]);

  const handleFilterChange = (id: PackageActivitiesFilterId) => {
    setActiveFilter(id);
    if (id === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ filter: id });
    }
  };

  const allGroups = useMemo(
    () => buildPackageClientGroups(engagements, sessions, config, todayIso, invoices),
    [engagements, sessions, config, todayIso, invoices],
  );

  const filtered = useMemo(
    () => filterPackageClientGroups(allGroups, activeFilter, config, todayIso),
    [allGroups, activeFilter, config, todayIso],
  );

  const searched = useMemo(
    () => searchPackageClientGroups(filtered, searchQuery),
    [filtered, searchQuery],
  );

  const totalPackages = useMemo(
    () => allGroups.reduce((sum, g) => sum + g.packages.length, 0),
    [allGroups],
  );

  const visiblePackages = searched.reduce((sum, g) => sum + g.packages.length, 0);
  const hasSearchOrFilter = searchQuery.trim().length > 0 || activeFilter !== 'all';
  const showEmpty = hydrated && totalPackages === 0;
  const showNoResults = hydrated && totalPackages > 0 && visiblePackages === 0 && hasSearchOrFilter;
  const showList = hydrated && visiblePackages > 0;

  const copy = PACKAGE_ACTIVITIES_PAGE_COPY;

  return (
    <div className="app-shell">
      <div className="page page-package-activities">
        {!hydrated ? (
          <ActivitiesPageSkeleton />
        ) : (
          <>
            <ActivitiesPageHeader
              title={copy.title}
              subtitle={copy.subtitle}
              count={totalPackages > 0 ? visiblePackages : undefined}
              ctaLabel={copy.emptyCta}
            />

            {totalPackages > 0 && (
              <>
                <ActivitiesSearchField
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={copy.searchPlaceholder}
                />

                <div className="activities-filter-chips">
                  <PillTabs
                    tabs={PACKAGE_ACTIVITIES_FILTERS}
                    active={activeFilter}
                    onChange={handleFilterChange}
                    ariaLabel="סינון כרטיסיות"
                  />
                </div>
              </>
            )}

            {showEmpty && (
              <EmptyState
                icon={TicketCheck}
                title={copy.emptyTitle}
                description={copy.emptyDescription}
              >
                <CreateActivityEmptyAction label={copy.emptyCta} />
              </EmptyState>
            )}

            {showNoResults && (
              <p className="activities-search-empty" role="status">
                לא נמצאו כרטיסיות התואמות לחיפוש או לסינון
              </p>
            )}

            {showList && (
              <div className="pkg-client-list">
                {searched.map((group) => (
                  <PackageClientRow
                    key={group.clientKey}
                    group={group}
                    invoices={invoices}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
