import { buildSankeyHeadline } from '../lib/sankeyHeadlines';
import { FinancialSankeyDiagram } from './FinancialSankeyDiagram';

interface RevenueChartProps {
  revenue: number;
  expense: number;
  profit: number;
}

export function RevenueChart({ revenue, expense, profit }: RevenueChartProps) {
  const headline = buildSankeyHeadline(revenue, expense, profit);

  return (
    <section className="sankey-section">
      <div className="sankey-flow-card">
        <header className="sankey-card-header">
          <p className="sankey-section-kicker">רווחיות החודש</p>
          <h2 className="sankey-headline">{headline}</h2>
        </header>
        <FinancialSankeyDiagram revenue={revenue} expense={expense} profit={profit} />
      </div>
    </section>
  );
}
