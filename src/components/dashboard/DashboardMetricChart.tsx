import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency, getMonthlySeries } from '../../lib/finance';
import type { Event, EventValue, PeriodFilter } from '../../types/models';

type MetricTab = 'revenue' | 'expense' | 'profit';

const TABS: Array<{ id: MetricTab; label: string }> = [
  { id: 'revenue', label: 'הכנסות' },
  { id: 'expense', label: 'הוצאות' },
  { id: 'profit', label: 'רווח' },
];

interface DashboardMetricChartProps {
  events: Event[];
  eventValues: EventValue[];
  period?: PeriodFilter;
}

export function DashboardMetricChart({
  events,
  eventValues,
  period = 'ytd',
}: DashboardMetricChartProps) {
  const [tab, setTab] = useState<MetricTab>('revenue');

  const data = useMemo(
    () => getMonthlySeries(events, eventValues, period),
    [events, eventValues, period],
  );

  const hasData = data.some((d) => d.revenue > 0 || d.expense > 0);

  const barColor =
    tab === 'revenue'
      ? 'var(--color-success)'
      : tab === 'expense'
        ? 'var(--color-error)'
        : 'var(--color-primary)';

  return (
    <section className="dash-section card dash-chart-card" aria-label="גרף פיננסי">
      <div className="dash-chart-header">
        <h2 className="dash-section-label" style={{ margin: 0 }}>
          מגמת כספים
        </h2>
        <div className="chip-row dash-chart-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <p className="empty-state" style={{ padding: '1.5rem 0' }}>
          אין נתונים להצגה — הוסיפו אירועים עם הכנסות/הוצאות
        </p>
      ) : (
        <div className="dash-chart-wrap">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  fontSize: 13,
                }}
              />
              <Bar dataKey={tab} fill={barColor} radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
