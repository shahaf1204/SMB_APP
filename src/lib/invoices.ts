import type { Invoice } from '../types/models';

export function isInvoiceOverdue(invoice: Invoice): boolean {
  if (invoice.status === 'paid') return false;
  const today = new Date().toISOString().slice(0, 10);
  return invoice.dueDate < today;
}
