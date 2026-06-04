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
  color,
}: {
  icon: string;
  title: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
      <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }} aria-hidden>
        {icon}
      </div>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{title}</p>
      <p
        style={{
          margin: '0.35rem 0 0',
          fontWeight: 700,
          fontSize: '1.05rem',
          color: color ?? 'var(--color-text)',
        }}
      >
        {value}
      </p>
    </div>
  );
}

export function KpiCards({ revenue, expense, profit }: KpiCardsProps) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      <KpiCard icon="💰" title="הכנסות" value={formatCurrency(revenue)} color="var(--color-success)" />
      <KpiCard icon="📉" title="הוצאות" value={formatCurrency(expense)} color="var(--color-error)" />
      <KpiCard icon="📈" title="רווח" value={formatCurrency(profit)} color="var(--color-primary)" />
    </div>
  );
}
