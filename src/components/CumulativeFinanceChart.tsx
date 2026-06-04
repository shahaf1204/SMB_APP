import { useMemo } from 'react';
import { CumulativeWaterfallChart } from './CumulativeWaterfallChart';
import { formatCurrency, getAllTimeTotals, type FinancialTotals } from '../lib/finance';
import type { Event, EventValue } from '../types/models';

interface CumulativeFinanceChartProps {
  events: Event[];
  eventValues: EventValue[];
}

function CumulativeTotalsRow({ totals }: { totals: FinancialTotals }) {
  return (
    <div className="cumulative-totals-row" aria-label="סיכום מצטבר">
      <div className="cumulative-total-card cumulative-total-revenue">
        <span className="cumulative-total-label">הכנסות מצטברות</span>
        <span className="cumulative-total-value">{formatCurrency(totals.revenue)}</span>
      </div>
      <div className="cumulative-total-card cumulative-total-expense">
        <span className="cumulative-total-label">הוצאות מצטברות</span>
        <span className="cumulative-total-value">{formatCurrency(totals.expense)}</span>
      </div>
      <div className="cumulative-total-card cumulative-total-profit">
        <span className="cumulative-total-label">רווח מצטבר</span>
        <span className="cumulative-total-value">{formatCurrency(totals.profit)}</span>
      </div>
    </div>
  );
}

export function CumulativeFinanceChart({ events, eventValues }: CumulativeFinanceChartProps) {
  const totals = useMemo(
    () => getAllTimeTotals(events, eventValues),
    [events, eventValues],
  );

  const hasData = totals.revenue > 0 || totals.expense > 0;

  return (
    <section className="card cumulative-finance-section" aria-labelledby="cumulative-title">
      <header className="cumulative-finance-header">
        <h2 id="cumulative-title" className="cumulative-finance-title">
          סיכום מצטבר לכל העסק
        </h2>
        <p className="cumulative-finance-sub">
          סה״כ מכל האירועים · לא תלוי בפילטר למעלה
        </p>
      </header>

      {!hasData ? (
        <p className="empty-state">עדיין אין נתוני כסף — הוסיפו הכנסות/הוצאות באירועים</p>
      ) : (
        <>
          <CumulativeTotalsRow totals={totals} />
          <CumulativeWaterfallChart totals={totals} />
        </>
      )}
    </section>
  );
}
