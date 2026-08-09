import type { Engagement, EngagementSession } from '../../types/models';

export interface PackageSessionsChartPoint {
  label: string;
  monthKey: string;
  sessionsUsed: number;
  packagesSold: number;
}

const MONTH_NAMES_HE = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthRange(monthCount: number, now = new Date()): Date[] {
  const months: Date[] = [];
  for (let i = monthCount - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d);
  }
  return months;
}

/** Monthly sessions used for package workspace chart — real data only. */
export function buildPackageSessionsChartData(
  engagements: Engagement[],
  sessions: EngagementSession[],
  monthCount = 6,
  now = new Date(),
): PackageSessionsChartPoint[] {
  const packIds = new Set(
    engagements.filter((e) => e.kind === 'session_pack').map((e) => e.id),
  );

  const months = buildMonthRange(monthCount, now);

  return months.map((monthStart) => {
    const key = monthKey(monthStart);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const sessionsUsed = sessions.filter((s) => {
      if (!packIds.has(s.engagementId)) return false;
      const d = new Date(s.date);
      return d >= monthStart && d <= monthEnd;
    }).length;

    const packagesSold = engagements.filter((e) => {
      if (e.kind !== 'session_pack') return false;
      const created = new Date(e.createdAt);
      return created >= monthStart && created <= monthEnd;
    }).length;

    return {
      label: MONTH_NAMES_HE[monthStart.getMonth()],
      monthKey: key,
      sessionsUsed,
      packagesSold,
    };
  });
}

export function packageChartHasData(points: PackageSessionsChartPoint[]): boolean {
  return points.some((p) => p.sessionsUsed > 0 || p.packagesSold > 0);
}
