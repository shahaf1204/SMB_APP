import { formatCurrency } from '../lib/finance';

interface KpiCardsProps {
  revenue: number;
  expense: number;
  profit: number;
}

function KpiCard({
  icon,
  title,
  value,
  iconClass,
  valueColor,
}: {
  icon: string;
  title: string;
  value: string;
  iconClass: string;
  valueColor?: string;
}) {
  return (
    <div className="kpi-card">
      <div className={`kpi-card-icon ${iconClass}`} aria-hidden>
        {icon}
      </div>
      <p className="kpi-card-label">{title}</p>
      <p className="kpi-card-value" style={{ color: valueColor ?? 'var(--color-text)' }}>
        {value}
      </p>
    </div>
  );
}

export function KpiCards({ revenue, expense, profit }: KpiCardsProps) {
  return (
    <div className="kpi-row">
      <KpiCard
        icon="💰"
        title="הכנסות"
        value={formatCurrency(revenue)}
        iconClass="kpi-card-icon--revenue"
        valueColor="var(--color-success)"
      />
      <KpiCard
        icon="📉"
        title="הוצאות"
        value={formatCurrency(expense)}
        iconClass="kpi-card-icon--expense"
        valueColor="var(--color-error)"
      />
      <KpiCard
        icon="📈"
        title="רווח"
        value={formatCurrency(profit)}
        iconClass="kpi-card-icon--profit"
        valueColor="var(--color-primary)"
      />
    </div>
  );
}
