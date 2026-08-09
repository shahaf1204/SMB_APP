import { useMemo } from 'react';
import { Package } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import {
  countExpiringSoon,
  countNearlyDepleted,
  getExpiringSoonPreviews,
  getNearlyDepletedPreviews,
} from '../../../lib/package/packagePreview';
import { packagesSoldThisMonth } from '../../../lib/package/packageClientList';
import { computePackageOperationalStats } from '../../../lib/package/packageDashboardStats';
import { resolvePackageDashboardConfig } from '../../../lib/package/resolvePackageDashboardConfig';
import { PackageActivitySummary } from '../../package/PackageActivitySummary';
import { PackageDashboardPreviewSection } from '../../package/PackagePreviewRow';

/** Dashboard preview sections only — max 3 rows per section, no full card lists */
export function PackageDashboardSections() {
  const business = useAppStore((s) => s.business);
  const engagements = useAppStore((s) => s.engagements ?? []);
  const sessions = useAppStore((s) => s.engagementSessions ?? []);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const config = useMemo(() => resolvePackageDashboardConfig(business), [business]);

  const nearlyDepleted = useMemo(
    () => getNearlyDepletedPreviews(engagements, config),
    [engagements, config],
  );
  const expiringSoon = useMemo(
    () => getExpiringSoonPreviews(engagements, config, todayIso),
    [engagements, config, todayIso],
  );

  const nearlyCount = useMemo(
    () => countNearlyDepleted(engagements, config),
    [engagements, config],
  );
  const expiringCount = useMemo(
    () => countExpiringSoon(engagements, config, todayIso),
    [engagements, config, todayIso],
  );

  const stats = useMemo(
    () => computePackageOperationalStats(engagements, sessions, config, todayIso),
    [engagements, sessions, config, todayIso],
  );

  const soldThisMonth = useMemo(
    () => packagesSoldThisMonth(engagements),
    [engagements],
  );

  const hasPreviews = nearlyDepleted.length > 0 || expiringSoon.length > 0;
  const hasAnyPackages = engagements.some((e) => e.kind === 'session_pack');

  if (!hasAnyPackages) {
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
      <PackageDashboardPreviewSection
        title="כרטיסיות קרובות לסיום"
        items={nearlyDepleted}
        totalCount={nearlyCount}
        viewAllHref="/activities?filter=low_remaining"
      />

      <PackageDashboardPreviewSection
        title="עומדות לפוג"
        items={expiringSoon}
        totalCount={expiringCount}
        viewAllHref="/activities?filter=expiring_soon"
        showUsage={false}
      />

      {!hasPreviews && (
        <section className="dash-v2-section dash-v2-section--tight pkg-preview-section" aria-label="כרטיסיות">
          <div className="dash-v2-section-head dash-v2-section-head--compact">
            <h2 className="dash-v2-section-title">כרטיסיות</h2>
          </div>
          <p className="dash-v2-package-empty pkg-preview-all-clear">
            <Package size={18} strokeWidth={1.75} aria-hidden />
            אין כרטיסיות שדורשות טיפול מיידי — הכל במסלול.
          </p>
        </section>
      )}

      <PackageActivitySummary stats={stats} packagesSoldThisMonth={soldThisMonth} />
    </>
  );
}
