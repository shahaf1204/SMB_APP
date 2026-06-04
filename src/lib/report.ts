import { calculateTotalsByEventIds } from './finance';
import { getClientName } from './events';
import type { Category, Event, EventValue, PeriodFilter } from '../types/models';
import { filterEventsByPeriod } from './finance';

export function buildPeriodReportCsv(
  events: Event[],
  eventValues: EventValue[],
  categories: Category[],
  period: PeriodFilter,
  businessName: string,
): string {
  const periodEvents = filterEventsByPeriod(events, period);
  const ids = new Set(periodEvents.map((e) => e.id));
  const totals = calculateTotalsByEventIds(ids, eventValues);

  const periodLabel: Record<PeriodFilter, string> = {
    thisMonth: 'החודש הנוכחי',
    lastMonth: 'חודש שעבר',
    nextMonth: 'חודש הבא',
    last7: '7 ימים',
    last30: '30 ימים',
    ytd: 'מתחילת השנה',
    allTime: 'כל הזמנים',
    allFuture: 'אירועים עתידיים',
  };

  const lines: string[] = [
    `דוח תקופה,${businessName}`,
    `תקופה,${periodLabel[period]}`,
    `הכנסות,${totals.revenue}`,
    `הוצאות,${totals.expense}`,
    `רווח,${totals.profit}`,
    '',
    'תאריך,שם אירוע,לקוח,מיקום',
  ];

  for (const ev of periodEvents.sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
  )) {
    const client = getClientName(ev.id, categories, eventValues) ?? '';
    lines.push(
      [
        ev.eventDate,
        escapeCsv(ev.title),
        escapeCsv(client),
        escapeCsv(ev.location),
      ].join(','),
    );
  }

  return '\uFEFF' + lines.join('\n');
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadPeriodReport(
  events: Event[],
  eventValues: EventValue[],
  categories: Category[],
  period: PeriodFilter,
  businessName: string,
): void {
  const csv = buildPeriodReportCsv(events, eventValues, categories, period, businessName);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `דוח-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
