import { useMemo } from 'react';
import { Package } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import {
  countExpiringSoon,
  countNearlyDepleted,
  getExpiringSoonPreviews,
  getNearlyDepletedPreviews,
} from '../../../lib/package/packagePreview';
import { resolvePackageDashboardConfig } from '../../../lib/package/resolvePackageDashboardConfig';
import { PackageDashboardPreviewSection } from '../../package/PackagePreviewRow';

/** Operational attention previews — max 3 rows per section, no KPI duplication */
export function PackageAttentionSections() {
  const business = useAppStore((s) => s.business);
  const engagements = useAppStore((s) => s.engagements ?? []);

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

  const hasPreviews = nearlyDepleted.length > 0 || expiringSoon.length > 0;
  const hasAnyPackages = engagements.some((e) => e.kind === 'session_pack');

  if (!hasAnyPackages || !hasPreviews) {
    return null;
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
    </>
  );
}

/** Shown when workspace has no packages yet */
export function PackageDashboardEmptyHint() {
  const engagements = useAppStore((s) => s.engagements ?? []);
  const hasAnyPackages = engagements.some((e) => e.kind === 'session_pack');

  if (hasAnyPackages) return null;

  return (
    <section className="dash-v2-section dash-v2-section--tight" aria-label="כרטיסיות">
      <p className="dash-v2-package-empty pkg-preview-all-clear">
        <Package size={18} strokeWidth={1.75} aria-hidden />
        אין כרטיסיות עדיין — צרו את הראשונה מהפעולות המהירות.
      </p>
    </section>
  );
}
