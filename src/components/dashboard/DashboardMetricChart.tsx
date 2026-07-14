import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
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
  { stroke: string; gradientId: string; gradientColor: string }
> = {
  revenue: { stroke: '#10B981', gradientId: 'dashGradRevenue', gradientColor: '#6EE7B7' },
  expense: { stroke: '#F59E0B', gradientId: 'dashGradExpense', gradientColor: '#FCD34D' },
  profit: { stroke: '#4F46E5', gradientId: 'dashGradProfit', gradientColor: '#A5B4FC' },
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
    <section className="dash-v2-chart-card" aria-label="גרף פיננסי">
      <div className="dash-v2-chart-head">
        <h2 className="dash-v2-chart-title">מצב העסק</h2>
        <p className="dash-v2-chart-sub">
          {hasData && peak > 0
            ? `שיא ${TABS.find((t) => t.id === tab)?.label}: ${formatCurrency(peak)}`
            : 'מגמת הכנסות, הוצאות ורווח'}
        </p>
      </div>

      <div className="dash-v2-segmented" role="tablist" aria-label="סוג מדד">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`dash-v2-segment ${tab === t.id ? 'dash-v2-segment--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!hasData ? (
        <div className="dash-v2-chart-empty">
          <span className="dash-v2-chart-empty-icon" aria-hidden>
            <BarChart3 size={32} strokeWidth={1.5} />
          </span>
          <p>אין נתונים להצגה — הוסיפו אירועים עם הכנסות או הוצאות כדי לראות את המגמה.</p>
        </div>
      ) : (
        <div className="dash-v2-chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
              <defs>
                {(['revenue', 'expense', 'profit'] as MetricTab[]).map((key) => (
                  <linearGradient key={key} id={CHART_THEME[key].gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_THEME[key].gradientColor} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={CHART_THEME[key].gradientColor} stopOpacity={0.03} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="4 6" stroke="rgba(79, 70, 229, 0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--ds-color-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--ds-color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), TABS.find((t) => t.id === tab)?.label]}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--ds-color-border)',
                  fontSize: 13,
                  fontFamily: 'var(--ds-font-family)',
                  boxShadow: 'var(--ds-shadow-md)',
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
