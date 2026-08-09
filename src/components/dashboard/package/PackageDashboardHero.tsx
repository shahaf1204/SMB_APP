import { useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { computePackageOperationalStats } from '../../../lib/package/packageDashboardStats';
import { resolvePackageDashboardConfig } from '../../../lib/package/resolvePackageDashboardConfig';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'בוקר טוב';
  if (hour < 17) return 'צהריים טובים';
  if (hour < 21) return 'ערב טוב';
  return 'לילה טוב';
}

function formatHeroDate(): string {
  return new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function buildPackageContextLine(stats: {
  activePackages: number;
  remainingSessions: number;
  packagesExpiringSoon: number;
}): string {
  if (stats.packagesExpiringSoon > 0) {
    return stats.packagesExpiringSoon === 1
      ? 'כרטיסייה אחת עומדת לפוג בקרוב'
      : `${stats.packagesExpiringSoon} כרטיסיות עומדות לפוג בקרוב`;
  }
  if (stats.activePackages === 0) {
    return 'אין כרטיסיות פעילות — זמן ליצור חדשה';
  }
  if (stats.remainingSessions > 0) {
    return `${stats.remainingSessions} מפגשים נותרו ב-${stats.activePackages} כרטיסיות פעילות`;
  }
  return `${stats.activePackages} כרטיסיות פעילות`;
}

export function PackageDashboardHero() {
  const business = useAppStore((s) => s.business);
  const user = useAppStore((s) => s.user)!;
  const engagements = useAppStore((s) => s.engagements ?? []);
  const sessions = useAppStore((s) => s.engagementSessions ?? []);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const config = useMemo(() => resolvePackageDashboardConfig(business), [business]);

  const stats = useMemo(
    () => computePackageOperationalStats(engagements, sessions, config, todayIso),
    [engagements, sessions, config, todayIso],
  );

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const dateLine = useMemo(() => formatHeroDate(), []);
  const contextLine = useMemo(() => buildPackageContextLine(stats), [stats]);

  return (
    <header className="dash-v2-hero dash-v2-hero--package" aria-label="ברוכים הבאים">
      <p className="dash-v2-hero-greeting">{greeting}</p>
      <h1 className="dash-v2-hero-name">{user.displayName}</h1>
      <p className="dash-v2-hero-subtitle">
        <span className="dash-v2-hero-subtitle-date">{dateLine}</span>
        <span className="dash-v2-hero-subtitle-sep" aria-hidden>
          ·
        </span>
        <span>{contextLine}</span>
      </p>
    </header>
  );
}
