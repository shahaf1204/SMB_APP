import { useEffect, useId, useState } from 'react';
import { formatCurrency } from '../lib/finance';

interface FinancialSankeyDiagramProps {
  revenue: number;
  expense: number;
  profit: number;
  /** כש-false — הסכומים מוצגים רק מחוץ לגרף (כרטיסיות מצטברות) */
  showAmountsOnDiagram?: boolean;
}

/** viewBox — רוחב מלא, גובה מוגדל ~1.6x */
const W = 420;
const H = 272;
const NODE_W = 48;
const PAD_X = 8;
const PAD_Y = 36;

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function formatWithPct(amount: number, total: number): string {
  return `${formatCurrency(amount)} (${pct(amount, total)}%)`;
}

/** זרימה מימין (הכנסות) לשמאל (רווח) — RTL */
function flowPathRtl(
  xRevenue: number,
  yRevenue: number,
  hRevenue: number,
  xProfit: number,
  yProfit: number,
  hProfit: number,
  nodeW: number,
): string {
  const xStart = xRevenue;
  const xEnd = xProfit + nodeW;
  const mx = (xStart + xEnd) / 2;
  return [
    `M ${xStart} ${yRevenue}`,
    `C ${mx} ${yRevenue}, ${mx} ${yProfit}, ${xEnd} ${yProfit}`,
    `L ${xEnd} ${yProfit + hProfit}`,
    `C ${mx} ${yProfit + hProfit}, ${mx} ${yRevenue + hRevenue}, ${xStart} ${yRevenue + hRevenue}`,
    'Z',
  ].join(' ');
}

interface TooltipState {
  text: string;
  sub?: string;
}

export function FinancialSankeyDiagram({
  revenue,
  expense,
  profit,
  showAmountsOnDiagram = true,
}: FinancialSankeyDiagramProps) {
  const gradientId = useId().replace(/:/g, '');
  const [phase, setPhase] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    setPhase(0);
    const timers = [
      setTimeout(() => setPhase(1), 50),
      setTimeout(() => setPhase(2), 220),
      setTimeout(() => setPhase(3), 520),
      setTimeout(() => setPhase(4), 680),
      setTimeout(() => setPhase(5), 780),
    ];
    return () => timers.forEach(clearTimeout);
  }, [revenue, expense, profit]);

  const hasData = revenue > 0 || expense > 0;
  if (!hasData) {
    return <p className="empty-state sankey-empty">אין נתונים פיננסיים לתקופה/לאירועים שנבחרו</p>;
  }

  const maxVal = Math.max(revenue, 1);
  const innerH = H - PAD_Y - 44;
  const revH = Math.max((revenue / maxVal) * innerH, revenue > 0 ? 36 : 0);
  const profitPositive = Math.max(profit, 0);
  const profitH = Math.max((profitPositive / maxVal) * innerH, profitPositive > 0 ? 28 : 0);

  const xRevenue = W - PAD_X - NODE_W;
  const xProfit = PAD_X;
  const yRevenue = PAD_Y + (innerH - revH) / 2;
  const yProfit = PAD_Y + (innerH - profitH) / 2;

  const marginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  const flowTip = [
    `הכנסות: ${formatCurrency(revenue)}`,
    `הוצאות: ${formatWithPct(expense, revenue)} מההכנסות`,
    `רווח: ${formatWithPct(profitPositive, revenue)} · שיעור רווחיות ${marginPct}%`,
  ].join('\n');

  const revAmountY = yRevenue + revH + 22;
  const profAmountY = yProfit + profitH + 22;

  return (
    <div className={`sankey-wrap sankey-phase-${phase}`}>
      {tooltip && (
        <div className="sankey-tooltip" role="tooltip">
          <p className="sankey-tooltip-main">{tooltip.text}</p>
          {tooltip.sub && <p className="sankey-tooltip-sub">{tooltip.sub}</p>}
        </div>
      )}

      <div className="sankey-canvas">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="sankey-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="תרשים זרימת רווחיות"
        >
          <defs>
            <linearGradient id={gradientId} x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#4A7185" />
              <stop offset="50%" stopColor="#6B95A8" />
              <stop offset="100%" stopColor="#5A9A78" />
            </linearGradient>
          </defs>

          {profitPositive > 0 && (
            <path
              className="sankey-flow-path"
              d={flowPathRtl(xRevenue, yRevenue, revH, xProfit, yProfit, profitH, NODE_W)}
              fill={`url(#${gradientId})`}
              fillOpacity={0.88}
              onMouseEnter={() =>
                setTooltip({
                  text: 'זרימת הכסף',
                  sub: flowTip.replace(/\n/g, ' · '),
                })
              }
              onMouseLeave={() => setTooltip(null)}
            />
          )}

          <g
            className="sankey-col sankey-col-revenue"
            onMouseEnter={() =>
              setTooltip({
                text: formatCurrency(revenue),
                sub: 'סך ההכנסות בתקופה שנבחרה',
              })
            }
            onMouseLeave={() => setTooltip(null)}
          >
            <text
              x={xRevenue + NODE_W / 2}
              y={yRevenue - 12}
              textAnchor="middle"
              className="sankey-node-label"
            >
              הכנסות
            </text>
            <rect x={xRevenue} y={yRevenue} width={NODE_W} height={revH} rx={10} fill="#4A7185" />
            {showAmountsOnDiagram && (
              <text
                x={xRevenue + NODE_W / 2}
                y={revAmountY}
                textAnchor="middle"
                className="sankey-node-amount"
              >
                {formatCurrency(revenue)}
              </text>
            )}
          </g>

          <g
            className="sankey-col sankey-col-profit"
            onMouseEnter={() =>
              setTooltip({
                text: formatWithPct(profitPositive, revenue),
                sub: `שיעור רווחיות ${marginPct}% מתוך ההכנסות`,
              })
            }
            onMouseLeave={() => setTooltip(null)}
          >
            <text
              x={xProfit + NODE_W / 2}
              y={yProfit - 12}
              textAnchor="middle"
              className="sankey-node-label"
            >
              רווח
            </text>
            {profitPositive > 0 ? (
              <>
                <rect x={xProfit} y={yProfit} width={NODE_W} height={profitH} rx={10} fill="#5A9A78" />
                {showAmountsOnDiagram && (
                  <text
                    x={xProfit + NODE_W / 2}
                    y={profAmountY}
                    textAnchor="middle"
                    className="sankey-node-amount sankey-node-amount-profit"
                  >
                    {formatWithPct(profitPositive, revenue)}
                  </text>
                )}
              </>
            ) : (
              <text
                x={xProfit + NODE_W / 2}
                y={PAD_Y + innerH / 2}
                textAnchor="middle"
                className="sankey-loss-inline"
              >
                הפסד
              </text>
            )}
          </g>
        </svg>
      </div>

      <div
        className="expense-badge expense-badge-compact sankey-expense-badge"
        onMouseEnter={() =>
          setTooltip({
            text: formatWithPct(expense, revenue),
            sub: 'מנוכה מההכנסות',
          })
        }
        onMouseLeave={() => setTooltip(null)}
      >
        <span className="expense-badge-label">הוצאות</span>
        {showAmountsOnDiagram && (
          <span className="expense-badge-value">{formatWithPct(expense, revenue)}</span>
        )}
      </div>
    </div>
  );
}

export { pct, formatWithPct };
