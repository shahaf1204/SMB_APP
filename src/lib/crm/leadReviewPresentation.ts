import type { Lead } from '../../types/models';
import { CRM_SOURCE_LABELS } from './constants';

const FORBIDDEN_DISPLAY =
  /access_token|EAA[A-Za-z0-9]{10,}|oauth|webhook|leadgen|graph\.facebook|"field_data"/i;

export function formatLeadSourceLabel(lead: Lead): string {
  if (lead.externalFormName?.trim()) {
    return `טופס: ${lead.externalFormName.trim()}`;
  }
  if (lead.externalPageName?.trim()) {
    return `${CRM_SOURCE_LABELS[lead.source] ?? 'מקור חיצוני'} · ${lead.externalPageName.trim()}`;
  }
  return CRM_SOURCE_LABELS[lead.source] ?? 'מקור חיצוני';
}

export function formatFormAnswerForDisplay(field: string, value: string): { label: string; value: string } | null {
  const label = field?.trim() ?? '';
  const v = value?.trim() ?? '';
  if (!label || !v) return null;
  if (FORBIDDEN_DISPLAY.test(label) || FORBIDDEN_DISPLAY.test(v)) return null;
  if (label.length > 120) return null;
  return { label, value: v };
}

export function buildLeadRequestSummary(lead: Lead): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  if (lead.serviceInterest?.trim()) {
    rows.push({ label: 'בקשה', value: lead.serviceInterest.trim() });
  }
  for (const a of lead.formAnswers ?? []) {
    const row = formatFormAnswerForDisplay(a.field, a.value);
    if (row) rows.push(row);
  }
  if (lead.notes?.trim() && !lead.notes.includes('access_token')) {
    const notes = lead.notes.trim();
    if (notes.length <= 500 && !FORBIDDEN_DISPLAY.test(notes)) {
      rows.push({ label: 'הערות', value: notes });
    }
  }
  return rows;
}

export function assertReviewPresentationSafe(text: string): boolean {
  return !FORBIDDEN_DISPLAY.test(text);
}

function labelsForMissingKeys(lead: Lead, keys: string[]): string[] {
  const snap = lead.completenessSnapshot;
  if (!snap) return [];
  const byKey = new Map(snap.requirements.map((r) => [r.fieldKey, r.labelHe]));
  return keys.map((k) => byKey.get(k) ?? '').filter(Boolean);
}

export function missingReviewFieldLabelsHe(lead: Lead): string[] {
  const snap = lead.completenessSnapshot;
  if (!snap) return [];
  return labelsForMissingKeys(lead, snap.missingReviewFieldKeys ?? []);
}

export function missingConversionFieldLabelsHe(lead: Lead): string[] {
  const snap = lead.completenessSnapshot;
  if (!snap) return [];
  return labelsForMissingKeys(lead, snap.missingConversionFieldKeys ?? []);
}

/** @deprecated use missingReviewFieldLabelsHe / missingConversionFieldLabelsHe */
export function missingFieldLabelsHe(lead: Lead): string[] {
  return missingReviewFieldLabelsHe(lead);
}
