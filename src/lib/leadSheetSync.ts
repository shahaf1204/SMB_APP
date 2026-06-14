import type { LeadSourceChannel } from '../types/models';
import { parseCsv, rowsToRecords } from './csvParse';
import {
  extractGoogleSheetGid,
  extractGoogleSheetId,
  loadLeadSheetSettings,
  saveLeadSheetSettings,
  type LeadSheetSettings,
} from './leadSheetSettings';

export interface ParsedExternalLead {
  name: string;
  phone?: string;
  email?: string;
  source: LeadSourceChannel;
  notes: string;
  createdAt: string;
  rowKey: string;
}

export type LeadSheetSyncResult =
  | { ok: true; imported: number; skipped: number; totalRows: number }
  | { ok: false; error: string };

const NAME_KEYS = [
  'full_name',
  'fullname',
  'name',
  'lead_name',
  'contact_name',
  'שם',
  'שם_מלא',
  'שם מלא',
  'שם_הלקוח',
  'שם לקוח',
  'first_name',
  'שם_פרטי',
  'שם פרטי',
];
const LAST_NAME_KEYS = ['last_name', 'שם_משפחה', 'שם משפחה'];
const PHONE_KEYS = [
  'phone_number',
  'phone',
  'mobile',
  'mobile_phone',
  'tel',
  'telephone',
  'contact_phone',
  'טלפון',
  'נייד',
  'מספר_טלפון',
  'מספר טלפון',
  'פלאפון',
  'סלולרי',
];
const EMAIL_KEYS = [
  'email',
  'email_address',
  'e-mail',
  'contact_email',
  'אימייל',
  'דוא"ל',
  'דואל',
  'מייל',
];
const DATE_KEYS = [
  'created_time',
  'timestamp',
  'date',
  'created',
  'submitted_at',
  'time',
  'תאריך',
  'זמן',
  'חותמת_זמן',
  'חותמת זמן',
];
const PLATFORM_KEYS = [
  'platform',
  'lead_status',
  'source',
  'channel',
  'מקור',
  'פלטפורמה',
  'ערוץ',
];
const AD_KEYS = [
  'ad_name',
  'campaign_name',
  'form_name',
  'adset_name',
  'מודעה',
  'קמפיין',
  'שם_הטופס',
  'שם טופס',
];

export interface SheetColumnMapping {
  headers: string[];
  mapped: {
    name?: string;
    phone?: string;
    email?: string;
    date?: string;
    source?: string;
  };
  totalRows: number;
  parseableRows: number;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

function findMatchingHeader(headers: string[], keys: string[]): string | undefined {
  const normalizedKeys = keys.map(normalizeHeader);
  for (const header of headers) {
    const h = normalizeHeader(header);
    if (!h) continue;
    if (normalizedKeys.includes(h)) return header;
    if (normalizedKeys.some((k) => h.includes(k) || k.includes(h))) return header;
  }
  return undefined;
}

function pickField(record: Record<string, string>, keys: string[]): string {
  const normalized = Object.fromEntries(
    Object.entries(record).map(([k, v]) => [normalizeHeader(k), v]),
  );
  for (const key of keys) {
    const nk = normalizeHeader(key);
    if (normalized[nk]?.trim()) return normalized[nk].trim();
    for (const [h, val] of Object.entries(normalized)) {
      if (val?.trim() && (h.includes(nk) || nk.includes(h))) return val.trim();
    }
  }
  return '';
}

function resolveLeadName(record: Record<string, string>): string {
  const full = pickField(record, NAME_KEYS);
  if (full) return full;
  const first = pickField(record, ['first_name', 'שם_פרטי', 'שם פרטי']);
  const last = pickField(record, LAST_NAME_KEYS);
  return [first, last].filter(Boolean).join(' ').trim();
}

function mapPlatformToSource(platform: string, adName: string): LeadSourceChannel {
  const text = `${platform} ${adName}`.toLowerCase();
  if (text.includes('instagram') || text.includes('ig') || text.includes('insta') || text.includes('אינסט')) {
    return 'instagram';
  }
  if (text.includes('facebook') || text.includes('fb') || text.includes('meta')) {
    return 'facebook';
  }
  if (text.includes('tiktok') || text.includes('tik tok')) return 'tiktok';
  if (text.includes('google') || text.includes('gdn') || text.includes('search')) {
    return 'google';
  }
  if (text.includes('whatsapp') || text.includes('wa')) return 'whatsapp';
  return 'other';
}

function parseLeadDate(raw: string): string {
  if (!raw.trim()) return new Date().toISOString();
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  return new Date().toISOString();
}

function buildRowKey(name: string, phone: string, email: string, dateRaw: string): string {
  return [name, phone, email, dateRaw]
    .map((v) => v.trim().toLowerCase())
    .join('|');
}

export function analyzeSheetCsv(csv: string): SheetColumnMapping {
  const rows = parseCsv(csv);
  const records = rowsToRecords(rows);
  const headers = rows[0]?.map((h) => h.trim()).filter(Boolean) ?? [];
  let parseableRows = 0;
  for (const record of records) {
    if (resolveLeadName(record)) parseableRows += 1;
  }
  return {
    headers,
    mapped: {
      name: findMatchingHeader(headers, [...NAME_KEYS, ...LAST_NAME_KEYS]),
      phone: findMatchingHeader(headers, PHONE_KEYS),
      email: findMatchingHeader(headers, EMAIL_KEYS),
      date: findMatchingHeader(headers, DATE_KEYS),
      source: findMatchingHeader(headers, [...PLATFORM_KEYS, ...AD_KEYS]),
    },
    totalRows: records.length,
    parseableRows,
  };
}

export async function previewSheetMapping(
  sheetId: string,
  gid?: string,
): Promise<{ ok: true; mapping: SheetColumnMapping } | { ok: false; error: string }> {
  try {
    const csv = await fetchSheetCsv(sheetId, gid);
    return { ok: true, mapping: analyzeSheetCsv(csv) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'לא ניתן לקרוא את הגיליון',
    };
  }
}

export function parseLeadsFromSheetCsv(csv: string): ParsedExternalLead[] {
  const rows = parseCsv(csv);
  const records = rowsToRecords(rows);
  const leads: ParsedExternalLead[] = [];

  for (const record of records) {
    const name = resolveLeadName(record);
    if (!name) continue;

    const phone = pickField(record, PHONE_KEYS);
    const email = pickField(record, EMAIL_KEYS);
    const dateRaw = pickField(record, DATE_KEYS);
    const platform = pickField(record, PLATFORM_KEYS);
    const adName = pickField(record, AD_KEYS);

    const extras = Object.entries(record)
      .filter(([, v]) => v.trim())
      .slice(0, 4)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');

    leads.push({
      name,
      phone: phone || undefined,
      email: email || undefined,
      source: mapPlatformToSource(platform, adName),
      notes: [adName, extras].filter(Boolean).join(' · '),
      createdAt: parseLeadDate(dateRaw),
      rowKey: buildRowKey(name, phone, email, dateRaw),
    });
  }

  return leads;
}

async function fetchSheetCsv(sheetId: string, gid?: string): Promise<string> {
  const params = new URLSearchParams({ id: sheetId });
  if (gid) params.set('gid', gid);
  const res = await fetch(`/api/sheet-csv?${params.toString()}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? 'לא ניתן לקרוא את הגיליון');
  }
  return res.text();
}

function isDuplicateInApp(
  lead: ParsedExternalLead,
  existing: Array<{ name: string; phone?: string; email?: string }>,
): boolean {
  const phone = lead.phone?.replace(/\D/g, '');
  const email = lead.email?.trim().toLowerCase();
  return existing.some((e) => {
    const ePhone = e.phone?.replace(/\D/g, '');
    const eEmail = e.email?.trim().toLowerCase();
    if (phone && ePhone && phone === ePhone) return true;
    if (email && eEmail && email === eEmail) return true;
    return false;
  });
}

export async function syncLeadsFromGoogleSheet(
  importLead: (lead: Omit<ParsedExternalLead, 'rowKey'>) => void,
  existingLeads: Array<{ name: string; phone?: string; email?: string }>,
  settingsOverride?: LeadSheetSettings,
): Promise<LeadSheetSyncResult> {
  const settings = settingsOverride ?? loadLeadSheetSettings();
  if (!settings.sheetId) {
    return { ok: false, error: 'לא הוגדר גיליון Google Sheets' };
  }

  try {
    const csv = await fetchSheetCsv(settings.sheetId, settings.gid || undefined);
    const parsed = parseLeadsFromSheetCsv(csv);
    const knownKeys = new Set(settings.importedRowKeys);
    let imported = 0;
    let skipped = 0;

    for (const lead of parsed) {
      if (knownKeys.has(lead.rowKey)) {
        skipped += 1;
        continue;
      }
      if (isDuplicateInApp(lead, existingLeads)) {
        knownKeys.add(lead.rowKey);
        skipped += 1;
        continue;
      }

      importLead({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        source: lead.source,
        notes: lead.notes,
        createdAt: lead.createdAt,
      });
      existingLeads.unshift({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
      });
      knownKeys.add(lead.rowKey);
      imported += 1;
    }

    saveLeadSheetSettings({
      ...settings,
      lastSyncAt: new Date().toISOString(),
      importedRowKeys: [...knownKeys],
    });

    return { ok: true, imported, skipped, totalRows: parsed.length };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'שגיאה בסנכרון הגיליון',
    };
  }
}

export function resolveSheetSettingsFromInput(input: string): Pick<
  LeadSheetSettings,
  'sheetInput' | 'sheetId' | 'gid'
> {
  const sheetId = extractGoogleSheetId(input);
  return {
    sheetInput: input.trim(),
    sheetId: sheetId ?? '',
    gid: extractGoogleSheetGid(input),
  };
}
