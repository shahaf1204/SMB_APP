import { Receipt, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency } from '../lib/finance';

export interface KpiInsight {
  delta?: string;
  sub: string;
}

export interface KpiInsights {
  revenue: KpiInsight;
  expense: KpiInsight;
  expected: KpiInsight;
}

interface KpiCardsProps {
  revenue: number;
  expense: number;
  expectedRevenue: number;
  insights: KpiInsights;
}

const KPI_CONFIG = [
  {
    key: 'revenue' as const,
    label: 'הכנסות החודש',
    icon: Wallet,
    variant: 'revenue',
  },
  {
    key: 'expense' as const,
    label: 'הוצאות החודש',
    icon: Receipt,
    variant: 'expense',
  },
  {
    key: 'expected' as const,
    label: 'הכנסות צפויות',
    icon: TrendingUp,
    variant: 'forecast',
  },
];

export function KpiCards({ revenue, expense, expectedRevenue, insights }: KpiCardsProps) {
  const values = { revenue, expense, expected: expectedRevenue };

  return (
    <section className="dash-v2-section dash-v2-section--tight" aria-label="סיכום כספי">
      <div className="dash-v2-section-head dash-v2-section-head--compact">
        <h2 className="dash-v2-section-title">סיכום חודשי</h2>
      </div>
      <div className="dash-v2-kpi-grid">
        {KPI_CONFIG.map(({ key, label, icon: Icon, variant }) => {
          const insight = insights[key];

          return (
            <div key={key} className={`dash-v2-kpi dash-v2-kpi--${variant} dash-v2-lift`}>
              <span className="dash-v2-kpi-icon" aria-hidden>
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span className="dash-v2-kpi-value">{formatCurrency(values[key])}</span>
              <span className="dash-v2-kpi-label">{label}</span>
              {insight.delta && (
                <span className="dash-v2-kpi-delta">{insight.delta}</span>
              )}
              <span className="dash-v2-kpi-sub">{insight.sub}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
