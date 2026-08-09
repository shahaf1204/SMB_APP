import { Receipt, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency } from '../lib/finance';

export interface KpiInsight {
  delta?: string;
  sub: string;
}

export interface KpiInsights {
  revenue: KpiInsight;
  expense: KpiInsight;
  profit?: KpiInsight;
  expected: KpiInsight;
}

interface KpiCardsProps {
  revenue: number;
  expense: number;
  expectedRevenue: number;
  insights: KpiInsights;
  hideExpected?: boolean;
  /** When set with hideExpected, shows revenue + expense + profit (financial section) */
  profit?: number;
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
  {
    key: 'profit' as const,
    label: 'רווח החודש',
    icon: TrendingUp,
    variant: 'profit',
  },
];

export function KpiCards({
  revenue,
  expense,
  expectedRevenue,
  insights,
  hideExpected,
  profit,
}: KpiCardsProps) {
  const values = { revenue, expense, expected: expectedRevenue, profit: profit ?? 0 };

  let cards = KPI_CONFIG;
  if (hideExpected && profit != null) {
    cards = KPI_CONFIG.filter((c) => c.key === 'revenue' || c.key === 'expense' || c.key === 'profit');
  } else if (hideExpected) {
    cards = KPI_CONFIG.filter((c) => c.key !== 'expected' && c.key !== 'profit');
  }

  return (
    <section className="dash-v2-section dash-v2-section--tight" aria-label="סיכום כספי">
      <div className="dash-v2-section-head dash-v2-section-head--compact">
        <h2 className="dash-v2-section-title">סיכום חודשי</h2>
      </div>
      <div className="dash-v2-kpi-grid">
        {cards.map(({ key, label, icon: Icon, variant }) => {
          const insight = insights[key as keyof KpiInsights];
          const displayValue =
            key === 'profit' || key === 'revenue' || key === 'expense' || key === 'expected'
              ? formatCurrency(values[key])
              : values[key as keyof typeof values];

          return (
            <div key={key} className={`dash-v2-kpi dash-v2-kpi--${variant} dash-v2-lift`}>
              <span className="dash-v2-kpi-icon" aria-hidden>
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span className="dash-v2-kpi-value">{displayValue}</span>
              <span className="dash-v2-kpi-label">{label}</span>
              {insight?.delta && (
                <span className="dash-v2-kpi-delta">{insight.delta}</span>
              )}
              {insight?.sub && (
                <span className="dash-v2-kpi-sub">{insight.sub}</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
