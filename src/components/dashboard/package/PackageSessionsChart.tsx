import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import {
  buildPackageSessionsChartData,
  packageChartHasData,
} from '../../../lib/package/packageSessionsChart';
import type { Engagement, EngagementSession } from '../../../types/models';

interface PackageSessionsChartProps {
  engagements: Engagement[];
  sessions: EngagementSession[];
}

export function PackageSessionsChart({ engagements, sessions }: PackageSessionsChartProps) {
  const data = useMemo(
    () => buildPackageSessionsChartData(engagements, sessions, 6),
    [engagements, sessions],
  );

  const hasData = packageChartHasData(data);
  const showPackagesSold = data.some((d) => d.packagesSold > 0);

  return (
    <section className="dash-v2-chart-card dash-v2-chart-card--package" aria-label="מפגשים שבוצעו">
      <div className="dash-v2-chart-head">
        <h2 className="dash-v2-chart-title">מפגשים שבוצעו</h2>
        <p className="dash-v2-chart-sub">מפגשים שנרשמו בחודש · 6 חודשים אחרונים</p>
      </div>

      {!hasData ? (
        <div className="dash-v2-chart-empty">
          <span className="dash-v2-chart-empty-icon" aria-hidden>
            <BarChart3 size={28} strokeWidth={1.5} />
          </span>
          <p>אין נתוני שימוש עדיין — לאחר רישום מפגשים, הגרף יופיע כאן.</p>
        </div>
      ) : (
        <div className="dash-v2-chart-wrap dash-v2-chart-animate">
          <ResponsiveContainer width="100%" height={288}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--ds-color-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'var(--ds-color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  value,
                  name === 'sessionsUsed' ? 'מפגשים שבוצעו' : 'כרטיסיות שנמכרו',
                ]}
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid var(--ds-color-border)',
                  fontSize: 12,
                  fontFamily: 'var(--ds-font-family)',
                  boxShadow: 'var(--ds-shadow-md)',
                  padding: '8px 12px',
                }}
              />
              {showPackagesSold && (
                <Legend
                  verticalAlign="top"
                  align="left"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingBottom: 4 }}
                  formatter={(value) =>
                    value === 'sessionsUsed' ? 'מפגשים שבוצעו' : 'כרטיסיות שנמכרו'
                  }
                />
              )}
              <Bar
                dataKey="sessionsUsed"
                name="sessionsUsed"
                fill="#6366F1"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
              {showPackagesSold && (
                <Bar
                  dataKey="packagesSold"
                  name="packagesSold"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
