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
import { resolveExpenseTrackingMode } from '../../lib/monthlyExpenses';
import type { Event, EventValue, MonthlyExpense, PeriodFilter } from '../../types/models';
import { useAppStore } from '../../store/useAppStore';

type MetricTab = 'revenue' | 'expense' | 'profit';

const TABS: Array<{ id: MetricTab; label: string }> = [
  { id: 'revenue', label: 'הכנסות' },
  { id: 'expense', label: 'הוצאות' },
  { id: 'profit', label: 'רווח' },
];

const CHART_THEME: Record<
  MetricTab,
  { stroke: string; fill: string; gradientId: string; gradientColor: string }
> = {
  revenue: { stroke: '#5A9A78', fill: '#C5DED0', gradientId: 'gradRevenue', gradientColor: '#7AB896' },
  expense: { stroke: '#C07575', fill: '#E8D0D0', gradientId: 'gradExpense', gradientColor: '#D49A9A' },
  profit: { stroke: '#6B95A8', fill: '#C5D8E0', gradientId: 'gradProfit', gradientColor: '#8AADBC' },
};

interface DashboardMetricChartProps {
  events: Event[];
  eventValues: EventValue[];
  monthlyExpenses?: MonthlyExpense[];
  period?: PeriodFilter;
}

export function DashboardMetricChart({
  events,
  eventValues,
  monthlyExpenses = [],
  period = 'ytd',
}: DashboardMetricChartProps) {
  const business = useAppStore((s) => s.business);
  const expenseMode = resolveExpenseTrackingMode(business);
  const [tab, setTab] = useState<MetricTab>('revenue');

  const data = useMemo(
    () => getMonthlySeries(events, eventValues, period, monthlyExpenses, expenseMode),
    [events, eventValues, period, monthlyExpenses, expenseMode],
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
                  <stop offset="0%" stopColor={CHART_THEME.revenue.gradientColor} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={CHART_THEME.revenue.gradientColor} stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_THEME.expense.gradientColor} stopOpacity={0.48} />
                  <stop offset="100%" stopColor={CHART_THEME.expense.gradientColor} stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_THEME.profit.gradientColor} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={CHART_THEME.profit.gradientColor} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" stroke="rgba(74,113,133,0.08)" vertical={false} />
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
