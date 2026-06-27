import { Receipt, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency } from '../lib/finance';

interface KpiCardsProps {
  revenue: number;
  expense: number;
  profit: number;
  expenseHint?: string;
}

const KPI_CONFIG = [
  { key: 'revenue' as const, label: 'הכנסות', icon: Wallet, variant: 'revenue' },
  { key: 'expense' as const, label: 'הוצאות', icon: Receipt, variant: 'expense' },
  { key: 'profit' as const, label: 'רווח', icon: TrendingUp, variant: 'profit' },
];

export function KpiCards({ revenue, expense, profit, expenseHint }: KpiCardsProps) {
  const values = { revenue, expense, profit };

  return (
    <section className="kpi-row kpi-row--dash" aria-label="סיכום כספי">
      {KPI_CONFIG.map(({ key, label, icon: Icon, variant }) => (
        <div key={key} className={`kpi-card kpi-card--${variant} kpi-card--dash`}>
          <span className={`kpi-card-icon kpi-card-icon--${variant}`} aria-hidden>
            <Icon size={18} strokeWidth={2.2} />
          </span>
          <span className="kpi-card-label">{label}</span>
          <span className="kpi-card-value">{formatCurrency(values[key])}</span>
          {key === 'expense' && expenseHint && (
            <span className="kpi-card-hint">{expenseHint}</span>
          )}
        </div>
      ))}
    </section>
  );
}
