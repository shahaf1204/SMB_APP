import { formatCurrency, type FinancialTotals } from '../lib/finance';

interface CumulativeWaterfallChartProps {
  totals: FinancialTotals;
}

const W = 340;
const H = 220;
const PAD_X = 20;
const PAD_TOP = 28;
const PAD_BOTTOM = 52;
const COL_W = 72;
const GAP = 26;

interface ColumnLayout {
  x: number;
  label: string;
  value: number;
  barY: number;
  barH: number;
  kind: 'increase' | 'decrease' | 'total';
  isLoss?: boolean;
}

export function CumulativeWaterfallChart({ totals }: CumulativeWaterfallChartProps) {
  const { revenue, expense, profit } = totals;
  const hasRevenue = revenue > 0;
  const baseline = H - PAD_BOTTOM;
  const chartH = baseline - PAD_TOP;
  const maxVal = Math.max(revenue, expense, Math.abs(profit), 1);

  const scale = (v: number) => (v / maxVal) * chartH;

  const cols: ColumnLayout[] = [];

  if (hasRevenue) {
    const revH = scale(revenue);
    const revY = baseline - revH;
    let x = W - PAD_X - COL_W;

    cols.push({
      x,
      label: 'הכנסות',
      value: revenue,
      barY: revY,
      barH: revH,
      kind: 'increase',
    });

    x -= COL_W + GAP;

    if (expense > 0) {
      const expH = scale(expense);
      cols.push({
        x,
        label: 'הוצאות',
        value: -expense,
        barY: revY,
        barH: expH,
        kind: 'decrease',
      });
      x -= COL_W + GAP;
    }

    const isLoss = profit < 0;
    const profH = scale(Math.abs(profit));
    const profY = isLoss ? baseline : baseline - profH;

    cols.push({
      x,
      label: isLoss ? 'הפסד' : 'רווח',
      value: profit,
      barY: profY,
      barH: profH,
      kind: 'total',
      isLoss,
    });
  }

  const revenueCol = cols.find((c) => c.kind === 'increase');
  const expenseCol = cols.find((c) => c.kind === 'decrease');
  const totalCol = cols.find((c) => c.kind === 'total');

  return (
    <div className="waterfall-chart" aria-label="גרף מפל מצטבר">
      <p className="waterfall-chart-title">מפל כספים — מהכנסות לרווח</p>

      {!hasRevenue ? (
        <p className="empty-state">אין הכנסות להצגה במפל</p>
      ) : (
        <div className="waterfall-canvas">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="waterfall-svg"
            preserveAspectRatio="xMidYMid meet"
            role="img"
          >
            <line
              x1={PAD_X}
              y1={baseline}
              x2={W - PAD_X}
              y2={baseline}
              className="waterfall-baseline"
            />

            {revenueCol && totalCol && (
              <path
                d={
                  expenseCol
                    ? `M ${revenueCol.x + COL_W / 2} ${revenueCol.barY} L ${expenseCol.x + COL_W / 2} ${expenseCol.barY} M ${expenseCol.x + COL_W / 2} ${expenseCol.barY + expenseCol.barH} L ${totalCol.x + COL_W / 2} ${totalCol.barY}`
                    : `M ${revenueCol.x + COL_W / 2} ${revenueCol.barY} L ${totalCol.x + COL_W / 2} ${totalCol.barY}`
                }
                className="waterfall-connector"
                fill="none"
              />
            )}

            {cols.map((col) => (
              <g key={col.label} className={`waterfall-col waterfall-${col.kind}`}>
                <text
                  x={col.x + COL_W / 2}
                  y={Math.max(col.barY - 6, PAD_TOP)}
                  textAnchor="middle"
                  className="waterfall-value"
                >
                  {formatCurrency(Math.abs(col.value))}
                </text>
                <rect
                  x={col.x}
                  y={col.barY}
                  width={COL_W}
                  height={Math.max(col.barH, 4)}
                  rx={8}
                  className={`waterfall-bar waterfall-bar-${col.kind}${col.isLoss ? ' waterfall-bar-loss' : ''}`}
                />
                <text
                  x={col.x + COL_W / 2}
                  y={baseline + 18}
                  textAnchor="middle"
                  className="waterfall-label"
                >
                  {col.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      <p className="waterfall-hint">
        עמודה כחולה = הכנסות · כתום = מה שיוצא · ירוק/אדום = מה שנשאר
      </p>
    </div>
  );
}
