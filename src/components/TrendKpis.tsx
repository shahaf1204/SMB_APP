import { formatCurrency } from '../lib/finance';
import type { TrendMetric } from '../lib/analytics';

interface TrendKpisProps {
  trends: TrendMetric[];
}

function formatChange(pct: number | null): string {
  if (pct === null) return '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}%`;
}

export function TrendKpis({ trends }: TrendKpisProps) {
  return (
    <section style={{ marginBottom: '1rem' }}>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
        מגמות — החודש מול חודש קודם
      </p>
      <div className="trend-grid">
        {trends.map((t) => {
          const up = (t.changePct ?? 0) > 0;
          const down = (t.changePct ?? 0) < 0;
          const good =
            t.label === 'הוצאות' ? down : up;
          return (
            <div key={t.label} className="card trend-card">
              <p className="trend-label">{t.label}</p>
              <p className="trend-value">{formatCurrency(t.current)}</p>
              <p
                className={`trend-change ${good ? 'trend-good' : t.changePct !== null && t.changePct !== 0 ? 'trend-bad' : ''}`}
              >
                {formatChange(t.changePct)} לעומת חודש קודם
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
