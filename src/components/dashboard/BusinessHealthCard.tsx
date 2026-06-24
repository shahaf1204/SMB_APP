import { TrendingUp, Wallet, Clock } from 'lucide-react';
import { formatCurrency } from '../../lib/finance';
import { summarizeInvoices } from '../../lib/invoiceReport';
import type { Invoice } from '../../types/models';

interface BusinessHealthCardProps {
  revenue: number;
  profit: number;
  invoices: Invoice[];
}

export function BusinessHealthCard({ revenue, profit, invoices }: BusinessHealthCardProps) {
  const summary = summarizeInvoices(invoices);
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  return (
    <section className="dash-section card dash-health-card" aria-label="בריאות העסק">
      <h2 className="dash-section-label">בריאות העסק</h2>
      <div className="dash-health-grid">
        <div className="dash-health-item">
          <span className="dash-health-icon dash-health-icon--primary">
            <Wallet size={16} strokeWidth={2} />
          </span>
          <div>
            <span className="dash-health-label">הכנסות החודש</span>
            <span className="dash-health-value">{formatCurrency(revenue)}</span>
          </div>
        </div>
        <div className="dash-health-item">
          <span className="dash-health-icon dash-health-icon--success">
            <TrendingUp size={16} strokeWidth={2} />
          </span>
          <div>
            <span className="dash-health-label">רווחיות</span>
            <span className="dash-health-value">{margin}%</span>
          </div>
        </div>
        <div className="dash-health-item">
          <span className="dash-health-icon dash-health-icon--accent">
            <Clock size={16} strokeWidth={2} />
          </span>
          <div>
            <span className="dash-health-label">גבייה ממתינה</span>
            <span className="dash-health-value">{formatCurrency(summary.unpaidAmount)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
