import { CUSTOMER_SOURCE_CATEGORY_NAME } from '../data/leadSources';
import { applyValueToEventValue, createEventValuesForEvent } from './events';
import { createId } from './ids';
import { parseCsv, rowsToRecords } from './csvParse';
import type { Category, Event, EventValue } from '../types/models';

export interface HistoricalEventRow {
  eventDate: string;
  title: string;
  location: string;
  notes: string;
  clientName?: string;
  revenue?: number;
  expense?: number;
  source?: string;
}

export interface ParseImportResult {
  ok: true;
  rows: HistoricalEventRow[];
  warnings: string[];
}

export interface ParseImportError {
  ok: false;
  error: string;
}

const HEADER_ALIASES: Record<string, keyof HistoricalEventRow> = {
  'תאריך אירוע': 'eventDate',
  'תאריך': 'eventDate',
  eventdate: 'eventDate',
  date: 'eventDate',
  'שם אירוע': 'title',
  'כותרת': 'title',
  title: 'title',
  'שם לקוח': 'clientName',
  'לקוח': 'clientName',
  client: 'clientName',
  clientname: 'clientName',
  הכנסות: 'revenue',
  'סכום הכנסה': 'revenue',
  revenue: 'revenue',
  הוצאות: 'expense',
  'סכום הוצאה': 'expense',
  expense: 'expense',
  מיקום: 'location',
  location: 'location',
  הערות: 'notes',
  notes: 'notes',
  'מקור הגעה': 'source',
  source: 'source',
};

/** מעל זה הדפדפן עלול להקפיא / למלא את האחסון המקומי */
export const MAX_CSV_IMPORT_ROWS = 600;

export const EVENT_IMPORT_TEMPLATE_CSV = `\uFEFFתאריך אירוע,שם אירוע,שם לקוח,הכנסות,הוצאות,מיקום,הערות,מקור הגעה
2025-01-15,יום הולדת — דוגמה,ישראל ישראלי,3500,400,בית הלקוח,,instagram
2025-02-20,צילום אירוע,דנה לוי,8000,1200,אולם אירועים,הלקוחה ביקשה אלבום,referral
`;

export function downloadEventImportTemplate(): void {
  const blob = new Blob([EVENT_IMPORT_TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'תבנית-ייבוא-אירועים.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function normalizeDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    return `${dmy[3]}-${m}-${d}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function parseNumber(raw: string): number | undefined {
  const s = raw.replace(/[₪,\s]/g, '').trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function mapRecord(rec: Record<string, string>): {
  row: HistoricalEventRow | null;
  warning?: string;
} {
  const mapped: Partial<HistoricalEventRow> = {
    location: '',
    notes: '',
  };

  for (const [header, value] of Object.entries(rec)) {
    const trimmed = header.trim();
    const key =
      HEADER_ALIASES[trimmed] ??
      HEADER_ALIASES[normalizeHeader(trimmed)];
    if (!key || !value) continue;
    if (key === 'revenue' || key === 'expense') {
      mapped[key] = parseNumber(value);
    } else if (key === 'eventDate') {
      const d = normalizeDate(value);
      if (d) mapped.eventDate = d;
    } else {
      mapped[key] = value;
    }
  }

  if (!mapped.eventDate || !mapped.title?.trim()) {
    return { row: null, warning: 'שורה ללא תאריך או שם אירוע — דולגה' };
  }

  return {
    row: {
      eventDate: mapped.eventDate,
      title: mapped.title.trim(),
      location: mapped.location?.trim() ?? '',
      notes: mapped.notes?.trim() ?? '',
      clientName: mapped.clientName?.trim(),
      revenue: mapped.revenue,
      expense: mapped.expense,
      source: mapped.source?.trim(),
    },
  };
}

export function parseEventsCsv(text: string): ParseImportResult | ParseImportError {
  const table = parseCsv(text);
  if (table.length < 2) {
    return { ok: false, error: 'הקובץ ריק או חסר שורת כותרות ונתונים' };
  }

  const records = rowsToRecords(table);
  const rows: HistoricalEventRow[] = [];
  const warnings: string[] = [];

  for (const rec of records) {
    const { row, warning } = mapRecord(rec);
    if (warning) warnings.push(warning);
    if (row) rows.push(row);
  }

  if (rows.length === 0) {
    return { ok: false, error: 'לא נמצאו שורות תקינות לייבוא' };
  }

  if (rows.length > MAX_CSV_IMPORT_ROWS) {
    return {
      ok: false,
      error: `יותר מ-${MAX_CSV_IMPORT_ROWS} אירועים בקובץ. פצלו לקבצים קטנים יותר כדי למנוע תקיעות.`,
    };
  }

  return { ok: true, rows, warnings };
}

const CLIENT_CATEGORY_HINTS = ['שם לקוח', 'לקוח', 'שם מטופל', 'שם מתאמן', 'שם תלמיד'];

function findClientCategory(categories: Category[]): Category | undefined {
  return categories.find(
    (c) =>
      c.isActive &&
      CLIENT_CATEGORY_HINTS.some((n) => c.name.includes(n) || n.includes(c.name)),
  );
}

function findRevenueCategory(categories: Category[]): Category | undefined {
  return categories.find((c) => c.isActive && c.metricRole === 'revenue');
}

function findExpenseCategory(categories: Category[]): Category | undefined {
  return categories.find((c) => c.isActive && c.metricRole === 'expense');
}

function findSourceCategory(categories: Category[]): Category | undefined {
  return categories.find((c) => c.isActive && c.name === CUSTOMER_SOURCE_CATEGORY_NAME);
}

export function buildEventValuesForImport(
  event: Event,
  categories: Category[],
  row: HistoricalEventRow,
): EventValue[] {
  const auto = createEventValuesForEvent(event, categories);
  const clientCat = findClientCategory(categories);
  const revCat = findRevenueCategory(categories);
  const expCat = findExpenseCategory(categories);
  const srcCat = findSourceCategory(categories);

  return auto.map((base) => {
    let ev = { ...base };
    if (clientCat && base.categoryId === clientCat.id && row.clientName) {
      ev = applyValueToEventValue(ev, clientCat, row.clientName);
    }
    if (revCat && base.categoryId === revCat.id && row.revenue != null) {
      ev = applyValueToEventValue(ev, revCat, row.revenue);
    }
    if (expCat && base.categoryId === expCat.id && row.expense != null) {
      ev = applyValueToEventValue(ev, expCat, row.expense);
    }
    if (srcCat && base.categoryId === srcCat.id && row.source) {
      ev = applyValueToEventValue(ev, srcCat, row.source);
    }
    return ev;
  });
}

export function importEventsIntoState(
  rows: HistoricalEventRow[],
  businessId: string,
  userId: string,
  categories: Category[],
  existingEvents: Event[],
  existingValues: EventValue[],
): { events: Event[]; eventValues: EventValue[]; imported: number } {
  const newEvents: Event[] = [];
  const newValues: EventValue[] = [];

  for (const row of rows) {
    const event: Event = {
      id: createId(),
      businessId,
      userId,
      title: row.title,
      eventDate: row.eventDate,
      location: row.location,
      notes: row.notes,
    };
    newEvents.push(event);
    newValues.push(...buildEventValuesForImport(event, categories, row));
  }

  return {
    events: [...existingEvents, ...newEvents],
    eventValues: [...existingValues, ...newValues],
    imported: newEvents.length,
  };
}
