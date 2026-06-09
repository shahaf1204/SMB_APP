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

const NAME_KEYS = ['full_name', 'fullname', 'name', 'שם', 'שם מלא', 'lead name'];
const PHONE_KEYS = [
  'phone_number',
  'phone',
  'mobile',
  'tel',
  'telephone',
  'טלפון',
  'נייד',
  'מספר טלפון',
];
const EMAIL_KEYS = ['email', 'email_address', 'e-mail', 'אימייל', 'דוא"ל', 'דואל'];
const DATE_KEYS = ['created_time', 'timestamp', 'date', 'created', 'תאריך', 'זמן'];
const PLATFORM_KEYS = ['platform', 'lead_status', 'source', 'מקור', 'פלטפורמה'];
const AD_KEYS = ['ad_name', 'campaign_name', 'form_name', 'מודעה'];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

function pickField(record: Record<string, string>, keys: string[]): string {
  const normalized = Object.fromEntries(
    Object.entries(record).map(([k, v]) => [normalizeHeader(k), v]),
  );
  for (const key of keys) {
    const val = normalized[normalizeHeader(key)];
    if (val?.trim()) return val.trim();
  }
  return '';
}

function mapPlatformToSource(platform: string, adName: string): LeadSourceChannel {
  const text = `${platform} ${adName}`.toLowerCase();
  if (text.includes('instagram') || text.includes('ig') || text.includes('insta')) {
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

export function parseLeadsFromSheetCsv(csv: string): ParsedExternalLead[] {
  const rows = parseCsv(csv);
  const records = rowsToRecords(rows);
  const leads: ParsedExternalLead[] = [];

  for (const record of records) {
    const name = pickField(record, NAME_KEYS);
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
