import { Receipt, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency } from '../lib/finance';

export interface KpiTrend {
  revenue?: string;
  expense?: string;
  profit?: string;
}

interface KpiCardsProps {
  revenue: number;
  expense: number;
  profit: number;
  expenseHint?: string;
  trends?: KpiTrend;
}

const KPI_CONFIG = [
  { key: 'revenue' as const, label: 'הכנסות', icon: Wallet, variant: 'revenue' },
  { key: 'expense' as const, label: 'הוצאות', icon: Receipt, variant: 'expense' },
  { key: 'profit' as const, label: 'רווח', icon: TrendingUp, variant: 'profit' },
];

export function KpiCards({ revenue, expense, profit, expenseHint, trends }: KpiCardsProps) {
  const values = { revenue, expense, profit };

  return (
    <section className="dash-v2-section" aria-label="סיכום כספי — החודש">
      <div className="dash-v2-section-head">
        <h2 className="dash-v2-section-title">סיכום החודש</h2>
        <p className="dash-v2-section-sub">הכנסות · הוצאות · רווח</p>
      </div>
      <div className="dash-v2-kpi-grid">
        {KPI_CONFIG.map(({ key, label, icon: Icon, variant }) => {
          const trend = trends?.[key];

          return (
            <div key={key} className={`dash-v2-kpi dash-v2-kpi--${variant}`}>
              <span className="dash-v2-kpi-icon" aria-hidden>
                <Icon size={24} strokeWidth={1.75} />
              </span>
              <span className="dash-v2-kpi-value">{formatCurrency(values[key])}</span>
              <span className="dash-v2-kpi-label">{label}</span>
              {trend && <span className="dash-v2-kpi-trend">{trend}</span>}
              {key === 'expense' && expenseHint && (
                <span className="dash-v2-kpi-hint">{expenseHint}</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
