import type { ExternalFormAppField, ExternalFormFieldMapping } from '../../types/externalForms';
import { DEFAULT_FORM_FIELD_MAPPINGS } from './normalizeFormFields';

const META_LABEL = /^(submission_|form_|created|id$|_)/i;

function normKey(s: string): string {
  return s.trim().toLowerCase();
}

function labelIncludes(label: string, terms: string[]): boolean {
  const lower = label.toLowerCase();
  return terms.some((t) => lower.includes(t.toLowerCase()));
}

const FUZZY_RULES: Array<{
  terms: string[];
  field: ExternalFormAppField;
  exclude?: string[];
}> = [
  { terms: ['parent', 'guardian', 'הורה', 'אפוטרופוס'], field: 'clientName' },
  {
    terms: ['birthday person', 'שם ילד', 'child name', 'ילד/ה', 'birthday child'],
    field: 'childName',
  },
  { terms: ['phone', 'טלפון', 'mobile', 'נייד', 'cel'], field: 'clientPhone' },
  { terms: ['email', 'אימייל', 'e-mail'], field: 'clientEmail' },
  {
    terms: ['event date', 'תאריך האירוע', 'תאריך'],
    field: 'activityDate',
    exclude: ['לידה'],
  },
  { terms: ['event time', 'שעת האירוע', 'שעה', 'time'], field: 'activityTime' },
  {
    terms: ['participants', 'משתתפ', 'guests', 'מספר ילד', 'מספר משתתפ', 'children', 'כמות'],
    field: 'participantsCount',
  },
  { terms: ['גיל', 'age'], field: 'childAge' },
  { terms: ['package', 'חביל', 'סוג'], field: 'packageName' },
  { terms: ['where', 'address', 'place', 'location', 'מיקום', 'כתובת', 'מקום'], field: 'location' },
  { terms: ['amount', 'סכום', 'price', 'מחיר'], field: 'amount' },
  { terms: ['notes', 'הערות', 'בקשות', 'theme', 'נושא'], field: 'notes' },
  { terms: ['title', 'נושא', 'subject'], field: 'activityTitle' },
];

export function inferAppFieldForLabel(label: string): ExternalFormAppField {
  const exact = DEFAULT_FORM_FIELD_MAPPINGS.find(
    (m) => normKey(m.externalField) === normKey(label),
  );
  if (exact) return exact.appField as ExternalFormAppField;

  for (const rule of FUZZY_RULES) {
    if (rule.exclude?.some((e) => labelIncludes(label, [e]))) continue;
    if (labelIncludes(label, rule.terms)) return rule.field;
  }

  if (
    labelIncludes(label, ['name', 'שם', 'fullname']) &&
    !labelIncludes(label, ['ילד', 'child', 'form', 'טופס'])
  ) {
    return 'clientName';
  }

  return 'notes';
}

/** Map detected form labels → app fields (one row per label). */
export function suggestFieldMappingFromLabels(labels: string[]): ExternalFormFieldMapping[] {
  const usedPrimary = new Set<ExternalFormAppField>();
  const rows: ExternalFormFieldMapping[] = [];

  for (const label of [...labels].sort()) {
    if (!label.trim() || META_LABEL.test(label)) continue;

    let appField = inferAppFieldForLabel(label);
    if (appField !== 'notes' && usedPrimary.has(appField)) {
      appField = 'notes';
    }
    if (appField !== 'notes') usedPrimary.add(appField);

    rows.push({ externalField: label, appField });
  }

  return rows;
}

/** Prefer detected labels; fill gaps from preset defaults. */
export function mergeSuggestedWithPreset(
  suggested: ExternalFormFieldMapping[],
  preset: ExternalFormFieldMapping[],
): ExternalFormFieldMapping[] {
  const byExternal = new Map<string, ExternalFormFieldMapping>();
  for (const row of preset) {
    if (row.externalField.trim()) byExternal.set(normKey(row.externalField), row);
  }
  for (const row of suggested) {
    byExternal.set(normKey(row.externalField), row);
  }
  return [...byExternal.values()];
}
