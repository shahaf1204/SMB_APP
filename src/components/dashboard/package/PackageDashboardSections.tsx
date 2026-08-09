import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityCard } from '../../business/ActivityCard';
import {
  groupPackageDashboardSections,
  PACKAGE_DASHBOARD_SECTIONS,
} from '../../../lib/package/packageDashboardStats';
import { mapPackageEngagementToActivityCard } from '../../../lib/package/mapPackageActivityCard';
import { resolvePackageDashboardConfig } from '../../../lib/package/resolvePackageDashboardConfig';
import { useAppStore } from '../../../store/useAppStore';

export function PackageDashboardSections() {
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business);
  const engagements = useAppStore((s) => s.engagements ?? []);
  const eventValues = useAppStore((s) => s.eventValues);
  const milestones = useAppStore((s) => s.milestones ?? []);
  const invoices = useAppStore((s) => s.invoices ?? []);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const config = useMemo(() => resolvePackageDashboardConfig(business), [business]);

  const grouped = useMemo(
    () => groupPackageDashboardSections(engagements, config, todayIso),
    [engagements, config, todayIso],
  );

  const hasAny = PACKAGE_DASHBOARD_SECTIONS.some(
    (section) => (grouped.get(section.id)?.length ?? 0) > 0,
  );

  if (!hasAny) {
    return (
      <section className="dash-v2-section dash-v2-section--tight" aria-label="כרטיסיות">
        <div className="dash-v2-section-head dash-v2-section-head--compact">
          <h2 className="dash-v2-section-title">כרטיסיות</h2>
        </div>
        <p className="dash-v2-package-empty">אין כרטיסיות עדיין — צרו את הראשונה מהפעולות המהירות.</p>
      </section>
    );
  }

  return (
    <>
      {PACKAGE_DASHBOARD_SECTIONS.map((section) => {
        const items = grouped.get(section.id) ?? [];
        if (items.length === 0) return null;

        return (
          <section
            key={section.id}
            className="dash-v2-section dash-v2-section--tight dash-v2-package-section"
            aria-label={section.title}
          >
            <div className="dash-v2-section-head dash-v2-section-head--compact">
              <h2 className="dash-v2-section-title">
                {section.title}
                <span className="dash-v2-package-section-count">{items.length}</span>
              </h2>
            </div>
            <ul className="dash-v2-package-card-list">
              {items.map((engagement) => {
                const card = mapPackageEngagementToActivityCard(engagement, {
                  navigate,
                  eventValues,
                  milestones,
                  invoices,
                  config,
                  todayIso,
                });
                return (
                  <li key={engagement.id}>
                    <ActivityCard {...card} />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
