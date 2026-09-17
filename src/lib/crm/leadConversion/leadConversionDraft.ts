import type { Lead } from '../../../types/models';
import type { LeadConversionDraft } from './types';

const DATE_PATTERNS = /תאריך|date|event date/i;
const TIME_PATTERNS = /שעה|time|event time/i;
const LOC_PATTERNS = /מיקום|location|venue|כתובת/i;

function pickFromAnswers(lead: Lead, patterns: RegExp): string | undefined {
  for (const a of lead.formAnswers ?? []) {
    if (!a.value?.trim() || !a.field?.trim()) continue;
    if (patterns.test(a.field)) return a.value.trim();
  }
  return undefined;
}

function normalizeDate(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  const d = new Date(raw.trim());
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const iso = raw.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : undefined;
}

export function buildLeadConversionDraft(lead: Lead): LeadConversionDraft {
  const activityDate = pickFromAnswers(lead, DATE_PATTERNS);
  const activityTime = pickFromAnswers(lead, TIME_PATTERNS);
  const location = pickFromAnswers(lead, LOC_PATTERNS);

  const title =
    lead.serviceInterest?.trim() ||
    pickFromAnswers(lead, /שירות|service|interest|טיפול|יום הולדת/i) ||
    `פנייה — ${lead.name}`;

  const notesParts: string[] = [];
  if (lead.notes?.trim()) notesParts.push(lead.notes.trim());
  if (activityTime && !notesParts.some((n) => n.includes(activityTime))) {
    notesParts.push(`שעה: ${activityTime}`);
  }
  notesParts.push('נוצר מהמרת ליד מאושר');

  return {
    clientName: lead.name,
    clientPhone: lead.phone?.trim() || undefined,
    clientEmail: lead.email?.trim() || undefined,
    title,
    activityDate: normalizeDate(activityDate),
    activityTime: activityTime?.trim(),
    location: location?.trim(),
    notes: notesParts.filter(Boolean).join('\n'),
  };
}

/** Merge owner edits into draft for conversion completeness checks. */
export function mergeConversionDraft(
  base: LeadConversionDraft,
  patch: Partial<LeadConversionDraft>,
): LeadConversionDraft {
  return { ...base, ...patch };
}
