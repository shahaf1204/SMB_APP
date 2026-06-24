import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
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

const CHART_THEME: Record<
  MetricTab,
  { stroke: string; fill: string; gradientId: string }
> = {
  revenue: { stroke: '#34D399', fill: '#A7F3D0', gradientId: 'gradRevenue' },
  expense: { stroke: '#F87171', fill: '#FECACA', gradientId: 'gradExpense' },
  profit: { stroke: '#818CF8', fill: '#C7D2FE', gradientId: 'gradProfit' },
};

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
  const theme = CHART_THEME[tab];
  const peak = Math.max(...data.map((d) => d[tab]), 0);

  return (
    <section className="dash-section card dash-chart-card dash-chart-card--premium" aria-label="גרף פיננסי">
      <div className="dash-chart-header">
        <div>
          <h2 className="dash-section-label" style={{ margin: 0 }}>
            מצב העסק
          </h2>
          {hasData && peak > 0 && (
            <p className="dash-chart-peak">
              שיא: {formatCurrency(peak)}
            </p>
          )}
        </div>
        <div className="pill-tabs dash-chart-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`pill-tab ${tab === t.id ? 'pill-tab--active' : ''}`}
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
        <div className="dash-chart-wrap dash-chart-wrap--area">
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6EE7B7" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#6EE7B7" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FCA5A5" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#FCA5A5" stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A5B4FC" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#A5B4FC" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" stroke="rgba(99,102,241,0.08)" vertical={false} />
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
                width={44}
                tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), TABS.find((t) => t.id === tab)?.label]}
                contentStyle={{
                  borderRadius: 14,
                  border: '1px solid var(--color-border)',
                  fontSize: 13,
                  boxShadow: 'var(--shadow-card-hover)',
                }}
              />
              <Area
                type="monotone"
                dataKey={tab}
                stroke={theme.stroke}
                strokeWidth={2.5}
                fill={`url(#${theme.gradientId})`}
                dot={{ r: 3, fill: theme.stroke, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: theme.stroke, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
