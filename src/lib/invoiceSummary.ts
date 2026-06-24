import { isInvoiceOverdue } from './invoices';
import type { Invoice } from '../types/models';

export interface InvoiceSummary {
  monthlyRevenue: number;
  paidAmount: number;
  paidCount: number;
  pendingAmount: number;
  pendingCount: number;
  overdueAmount: number;
  overdueCount: number;
}

export function summarizeInvoicesPage(invoices: Invoice[]): InvoiceSummary {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  let monthlyRevenue = 0;
  let paidAmount = 0;
  let paidCount = 0;
  let pendingAmount = 0;
  let pendingCount = 0;
  let overdueAmount = 0;
  let overdueCount = 0;

  for (const inv of invoices) {
    if (inv.issuedAt >= monthStart) {
      monthlyRevenue += inv.amount;
    }
    if (inv.status === 'paid') {
      paidAmount += inv.amount;
      paidCount += 1;
    } else if (isInvoiceOverdue(inv)) {
      overdueAmount += inv.amount;
      overdueCount += 1;
    } else {
      pendingAmount += inv.amount;
      pendingCount += 1;
    }
  }

  return {
    monthlyRevenue,
    paidAmount,
    paidCount,
    pendingAmount,
    pendingCount,
    overdueAmount,
    overdueCount,
  };
}

export type InvoiceFilterTab = 'all' | 'paid' | 'pending' | 'overdue';

export function filterInvoicesByTab(invoices: Invoice[], tab: InvoiceFilterTab): Invoice[] {
  if (tab === 'all') return invoices;
  if (tab === 'paid') return invoices.filter((i) => i.status === 'paid');
  if (tab === 'overdue') return invoices.filter(isInvoiceOverdue);
  return invoices.filter((i) => i.status !== 'paid' && !isInvoiceOverdue(i));
}
