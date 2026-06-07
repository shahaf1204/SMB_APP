import { mailtoWithBody } from './contact';
import { formatCurrency } from './finance';
import { isInvoiceOverdue } from './invoices';
import type { Business, Invoice, InvoiceStatus } from '../types/models';

export type InvoiceReportRange =
  | { kind: 'month'; year: number; month: number }
  | { kind: 'year'; year: number };

const STATUS_HE: Record<InvoiceStatus, string> = {
  draft: 'טיוטה',
  sent: 'נשלחה — ממתין לתשלום',
  paid: 'שולמה',
};

export interface InvoiceReportSummary {
  count: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
  unpaidCount: number;
  unpaidAmount: number;
  overdueCount: number;
  overdueAmount: number;
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function invoiceIssuedMonthKey(invoice: Invoice): string {
  const d = new Date(invoice.issuedAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function filterInvoicesByRange(
  invoices: Invoice[],
  range: InvoiceReportRange,
): Invoice[] {
  return invoices.filter((inv) => {
    const d = new Date(inv.issuedAt);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    if (range.kind === 'year') return y === range.year;
    return y === range.year && m === range.month;
  });
}

export function formatInvoiceReportPeriodLabel(range: InvoiceReportRange): string {
  if (range.kind === 'year') return String(range.year);
  const d = new Date(range.year, range.month - 1, 1);
  return d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
}

export function summarizeInvoices(invoices: Invoice[]): InvoiceReportSummary {
  let totalAmount = 0;
  let paidCount = 0;
  let paidAmount = 0;
  let unpaidCount = 0;
  let unpaidAmount = 0;
  let overdueCount = 0;
  let overdueAmount = 0;

  for (const inv of invoices) {
    totalAmount += inv.amount;
    if (inv.status === 'paid') {
      paidCount += 1;
      paidAmount += inv.amount;
    } else {
      unpaidCount += 1;
      unpaidAmount += inv.amount;
      if (isInvoiceOverdue(inv)) {
        overdueCount += 1;
        overdueAmount += inv.amount;
      }
    }
  }

  return {
    count: invoices.length,
    totalAmount,
    paidCount,
    paidAmount,
    unpaidCount,
    unpaidAmount,
    overdueCount,
    overdueAmount,
  };
}

function monthlyBreakdownRows(invoices: Invoice[]): string[] {
  const byMonth = new Map<string, Invoice[]>();
  for (const inv of invoices) {
    const key = invoiceIssuedMonthKey(inv);
    const list = byMonth.get(key) ?? [];
    list.push(inv);
    byMonth.set(key, list);
  }

  const lines = ['', 'פירוט לפי חודש', 'חודש,מספר חשבוניות,סה״כ (₪),שולמו (₪),ממתין (₪)'];
  for (const key of [...byMonth.keys()].sort()) {
    const list = byMonth.get(key)!;
    const summary = summarizeInvoices(list);
    const label = new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleDateString(
      'he-IL',
      { month: 'long', year: 'numeric' },
    );
    lines.push(
      [
        escapeCsv(label),
        String(summary.count),
        String(summary.totalAmount),
        String(summary.paidAmount),
        String(summary.unpaidAmount),
      ].join(','),
    );
  }
  return lines;
}

export function buildInvoiceReportCsv(
  invoices: Invoice[],
  business: Business,
  range: InvoiceReportRange,
): string {
  const filtered = filterInvoicesByRange(invoices, range);
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime(),
  );
  const summary = summarizeInvoices(sorted);
  const periodLabel = formatInvoiceReportPeriodLabel(range);
  const reportKind = range.kind === 'month' ? 'חודשי' : 'שנתי';

  const lines: string[] = [
    `דוח חשבוניות,${escapeCsv(business.name)}`,
    `סוג דוח,${reportKind}`,
    `תקופה,${escapeCsv(periodLabel)}`,
    `הופק ב,${new Date().toLocaleDateString('he-IL')}`,
    '',
    'סיכום',
    `סה״כ חשבוניות,${summary.count}`,
    `סה״כ סכום (₪),${summary.totalAmount}`,
    `שולמו — מספר,${summary.paidCount}`,
    `שולמו — סכום (₪),${summary.paidAmount}`,
    `ממתין לתשלום — מספר,${summary.unpaidCount}`,
    `ממתין לתשלום — סכום (₪),${summary.unpaidAmount}`,
    `באיחור — מספר,${summary.overdueCount}`,
    `באיחור — סכום (₪),${summary.overdueAmount}`,
  ];

  if (range.kind === 'year') {
    lines.push(...monthlyBreakdownRows(sorted));
  }

  lines.push(
    '',
    'מספר חשבונית,תאריך הפקה,לתשלום עד,שם לקוח,אימייל,סכום (₪),סטטוס,באיחור,הערות',
  );

  for (const inv of sorted) {
    lines.push(
      [
        inv.invoiceNumber,
        inv.issuedAt,
        inv.dueDate,
        escapeCsv(inv.clientName),
        escapeCsv(inv.clientEmail ?? ''),
        inv.amount,
        STATUS_HE[inv.status],
        isInvoiceOverdue(inv) ? 'כן' : 'לא',
        escapeCsv(inv.notes.trim()),
      ].join(','),
    );
  }

  return '\uFEFF' + lines.join('\n');
}

function reportFileSlug(range: InvoiceReportRange): string {
  if (range.kind === 'month') {
    const m = String(range.month).padStart(2, '0');
    return `${range.year}-${m}`;
  }
  return String(range.year);
}

export function downloadInvoiceReport(
  invoices: Invoice[],
  business: Business,
  range: InvoiceReportRange,
): void {
  const csv = buildInvoiceReportCsv(invoices, business, range);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `דוח-חשבוניות-${reportFileSlug(range)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildInvoiceReportEmailBody(
  invoices: Invoice[],
  business: Business,
  range: InvoiceReportRange,
): string {
  const filtered = filterInvoicesByRange(invoices, range);
  const summary = summarizeInvoices(filtered);
  const periodLabel = formatInvoiceReportPeriodLabel(range);
  const reportKind = range.kind === 'month' ? 'חודשי' : 'שנתי';

  return [
    'שלום,',
    '',
    `מצורף דוח חשבוניות ${reportKind} עבור ${business.name}.`,
    `תקופה: ${periodLabel}`,
    '',
    'סיכום:',
    `• ${summary.count} חשבוניות`,
    `• סה״כ: ${formatCurrency(summary.totalAmount)}`,
    `• שולמו: ${summary.paidCount} (${formatCurrency(summary.paidAmount)})`,
    `• ממתין לתשלום: ${summary.unpaidCount} (${formatCurrency(summary.unpaidAmount)})`,
    summary.overdueCount > 0
      ? `• באיחור: ${summary.overdueCount} (${formatCurrency(summary.overdueAmount)})`
      : '',
    '',
    'אנא צרפו את קובץ ה-CSV שהורדתם מהאפליקציה למייל זה.',
    '',
    'תודה,',
    business.name,
  ]
    .filter(Boolean)
    .join('\n');
}

export function invoiceReportMailtoHref(
  invoices: Invoice[],
  business: Business,
  range: InvoiceReportRange,
): string {
  const periodLabel = formatInvoiceReportPeriodLabel(range);
  const reportKind = range.kind === 'month' ? 'חודשי' : 'שנתי';
  const subject = `דוח חשבוניות ${reportKind} — ${business.name} — ${periodLabel}`;
  const body = buildInvoiceReportEmailBody(invoices, business, range);
  return mailtoWithBody('', { subject, body });
}

export function availableInvoiceReportYears(invoices: Invoice[]): number[] {
  const years = new Set<number>([new Date().getFullYear()]);
  for (const inv of invoices) {
    years.add(new Date(inv.issuedAt).getFullYear());
  }
  return [...years].sort((a, b) => b - a);
}
