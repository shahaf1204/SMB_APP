import { mailtoWithBody } from './contact';
import { formatCurrency } from './finance';
import type { Business, Event, Invoice } from '../types/models';

export function isInvoiceOverdue(invoice: Invoice): boolean {
  if (invoice.status === 'paid') return false;
  const today = new Date().toISOString().slice(0, 10);
  return invoice.dueDate < today;
}

export function buildInvoiceEmailBody(invoice: Invoice, business: Business): string {
  const issued = new Date(invoice.issuedAt).toLocaleDateString('he-IL');
  const due = new Date(invoice.dueDate).toLocaleDateString('he-IL');
  const lines = [
    `שלום ${invoice.clientName},`,
    '',
    `מצורפת חשבונית מ${business.name}.`,
    '',
    `חשבונית מס׳ ${invoice.invoiceNumber}`,
    `תאריך הפקה: ${issued}`,
    `לתשלום עד: ${due}`,
    `סכום לתשלום: ${formatCurrency(invoice.amount)}`,
  ];
  if (invoice.notes.trim()) {
    lines.push('', `הערות: ${invoice.notes.trim()}`);
  }
  lines.push('', 'תודה!', business.name);
  return lines.join('\n');
}

export function resolveInvoiceClientEmail(
  invoice: Invoice,
  events: Event[],
): string | undefined {
  const onInvoice = invoice.clientEmail?.trim();
  if (onInvoice) return onInvoice;
  if (!invoice.eventId) return undefined;
  return events.find((e) => e.id === invoice.eventId)?.clientEmail?.trim();
}

export function invoiceMailtoHref(
  invoice: Invoice,
  business: Business,
  events: Event[] = [],
): string | null {
  const to = resolveInvoiceClientEmail(invoice, events);
  if (!to) return null;
  const subject = `חשבונית מס׳ ${invoice.invoiceNumber} — ${business.name}`;
  const body = buildInvoiceEmailBody(invoice, business);
  return mailtoWithBody(to, { subject, body });
}
