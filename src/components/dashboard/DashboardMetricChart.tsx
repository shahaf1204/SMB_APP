import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency, getMonthlySeries } from '../../lib/finance';
import { resolveExpenseTrackingMode } from '../../lib/monthlyExpenses';
import type { Event, EventValue, MonthlyExpense, PeriodFilter } from '../../types/models';
import { useAppStore } from '../../store/useAppStore';

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

  const data = useMemo(
    () => getMonthlySeries(events, eventValues, period, monthlyExpenses, expenseMode),
    [events, eventValues, period, monthlyExpenses, expenseMode],
  );

  const hasData = data.some((d) => d.revenue > 0 || d.expense > 0);

  return (
    <section className="dash-v2-chart-card" aria-label="Business Performance">
      <div className="dash-v2-chart-head">
        <h2 className="dash-v2-chart-title">Business Performance</h2>
        <p className="dash-v2-chart-sub">Revenue vs Expenses · YTD</p>
      </div>

      {!hasData ? (
        <div className="dash-v2-chart-empty">
          <span className="dash-v2-chart-empty-icon" aria-hidden>
            <BarChart3 size={28} strokeWidth={1.5} />
          </span>
          <p>אין נתונים להצגה — הוסיפו אירועים עם הכנסות או הוצאות.</p>
        </div>
      ) : (
        <div className="dash-v2-chart-wrap dash-v2-chart-animate">
          <ResponsiveContainer width="100%" height={288}>
            <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--ds-color-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--ds-color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'revenue' ? 'הכנסות' : 'הוצאות',
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
              <Legend
                verticalAlign="top"
                align="left"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingBottom: 4 }}
                formatter={(value) => (value === 'revenue' ? 'הכנסות' : 'הוצאות')}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="expense"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
