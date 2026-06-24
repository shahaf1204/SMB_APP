import { formatCurrency } from '../lib/finance';

interface KpiCardsProps {
  revenue: number;
  expense: number;
  profit: number;
}

function KpiCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: 'revenue' | 'expense' | 'profit';
}) {
  return (
    <div className={`kpi-compact kpi-compact--${variant}`}>
      <span className="kpi-compact-label">{label}</span>
      <span className="kpi-compact-value">{value}</span>
    </div>
  );
}

export function KpiCards({ revenue, expense, profit }: KpiCardsProps) {
  return (
    <section className="kpi-compact-row" aria-label="סיכום כספי">
      <KpiCard label="הכנסות" value={formatCurrency(revenue)} variant="revenue" />
      <KpiCard label="הוצאות" value={formatCurrency(expense)} variant="expense" />
      <KpiCard label="רווח" value={formatCurrency(profit)} variant="profit" />
    </section>
  );
}
