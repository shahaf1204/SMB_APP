/** Shared form → app field normalization (keep in sync with api/webhooks/forms.ts). */

export interface NormalizedFormFields {
  clientName?: string;
  childName?: string;
  childAge?: string;
  clientPhone?: string;
  clientEmail?: string;
  activityDate?: string;
  activityTime?: string;
  location?: string;
  participantsCount?: string;
  packageName?: string;
  notes?: string;
  activityTitle?: string;
  amount?: string;
}

export interface FieldMappingRow {
  externalField: string;
  appField: string;
}

export const DEFAULT_FORM_FIELD_MAPPINGS: FieldMappingRow[] = [
  { externalField: 'Parent Name', appField: 'clientName' },
  { externalField: 'שם ההורה', appField: 'clientName' },
  { externalField: 'שם מלא', appField: 'clientName' },
  { externalField: 'Phone', appField: 'clientPhone' },
  { externalField: 'טלפון', appField: 'clientPhone' },
  { externalField: 'Email', appField: 'clientEmail' },
  { externalField: 'אימייל', appField: 'clientEmail' },
  { externalField: 'Child Name', appField: 'childName' },
  { externalField: 'שם הילד/ה', appField: 'childName' },
  { externalField: 'שם ילד/ה', appField: 'childName' },
  { externalField: 'גיל הילד/ה', appField: 'childAge' },
  { externalField: 'Event Date', appField: 'activityDate' },
  { externalField: 'תאריך האירוע', appField: 'activityDate' },
  { externalField: 'תאריך', appField: 'activityDate' },
  { externalField: 'Event Time', appField: 'activityTime' },
  { externalField: 'שעת האירוע', appField: 'activityTime' },
  { externalField: 'שעה', appField: 'activityTime' },
  { externalField: 'Location', appField: 'location' },
  { externalField: 'מיקום האירוע', appField: 'location' },
  { externalField: 'מיקום', appField: 'location' },
  { externalField: 'מספר משתתפים', appField: 'participantsCount' },
  { externalField: 'מספר ילדים', appField: 'participantsCount' },
  { externalField: 'חבילת פעילות', appField: 'packageName' },
  { externalField: 'Notes', appField: 'notes' },
  { externalField: 'הערות', appField: 'notes' },
];

const CLIENT_CATEGORY_NAMES = ['שם לקוח', 'לקוח', 'שם מטופל', 'שם מתאמן', 'שם תלמיד'];
const CHILD_COUNT_CATEGORY_NAMES = ['מספר ילדים', 'משתתפ', 'מספר משתתפים', 'כמות'];

function normKey(key: string): string {
  return key.trim().toLowerCase();
}

function labelIncludes(label: string, terms: string[]): boolean {
  const lower = label.toLowerCase();
  return terms.some((t) => lower.includes(t.toLowerCase()));
}

export function applyExplicitFieldMapping(
  parsed: Record<string, string>,
  mappings: FieldMappingRow[],
): NormalizedFormFields {
  const fields: NormalizedFormFields = {};
  const usedKeys = new Set<string>();

  for (const { externalField, appField } of mappings) {
    const target = normKey(externalField);
    let val = parsed[externalField]?.trim();
    if (!val) {
      for (const [key, value] of Object.entries(parsed)) {
        if (normKey(key) === target && value.trim()) {
          val = value.trim();
          usedKeys.add(key);
          break;
        }
      }
    } else {
      usedKeys.add(externalField);
    }
    if (!val) continue;
    (fields as Record<string, string>)[appField] = val;
  }
  return fields;
}

export function fuzzyMapFormFields(parsed: Record<string, string>): NormalizedFormFields {
  const fields: NormalizedFormFields = {};

  for (const [label, value] of Object.entries(parsed)) {
    const v = value.trim();
    if (!v) continue;

    if (labelIncludes(label, ['birthday person', 'שם ילד', 'child name', 'ילד/ה', 'birthday child'])) {
      fields.childName = v;
      continue;
    }
    if (labelIncludes(label, ['phone', 'טלפון', 'mobile', 'נייד', 'cel'])) {
      fields.clientPhone = v;
      continue;
    }
    if (labelIncludes(label, ['email', 'אימייל', 'e-mail'])) {
      fields.clientEmail = v;
      continue;
    }
    if (labelIncludes(label, ['event date', 'תאריך האירוע', 'תאריך']) && !labelIncludes(label, ['לידה'])) {
      fields.activityDate = v;
      continue;
    }
    if (labelIncludes(label, ['event time', 'שעת האירוע', 'שעה', 'time'])) {
      fields.activityTime = v;
      continue;
    }
    if (labelIncludes(label, ['participants', 'משתתפ', 'guests', 'מספר ילד', 'מספר משתתפ', 'children'])) {
      fields.participantsCount = v;
      continue;
    }
    if (labelIncludes(label, ['גיל'])) {
      fields.childAge = v;
      continue;
    }
    if (labelIncludes(label, ['package', 'חביל'])) {
      fields.packageName = v;
      continue;
    }
    if (labelIncludes(label, ['where', 'address', 'place', 'location', 'מיקום', 'כתובת', 'מקום'])) {
      fields.location = v;
      continue;
    }
    if (labelIncludes(label, ['notes', 'הערות', 'בקשות', 'theme', 'נושא'])) {
      fields.notes = fields.notes ? `${fields.notes}\n${v}` : v;
      continue;
    }
    if (labelIncludes(label, ['parent', 'guardian', 'הורה', 'אפוטרופוס'])) {
      if (!fields.clientName) fields.clientName = v;
      continue;
    }
    if (labelIncludes(label, ['name', 'שם', 'fullname']) && !labelIncludes(label, ['ילד', 'child'])) {
      if (!fields.clientName) fields.clientName = v;
    }
  }

  if (!fields.clientName && fields.childName) fields.clientName = fields.childName;
  return fields;
}

export function mergeNormalizedFields(
  explicit: NormalizedFormFields,
  fuzzy: NormalizedFormFields,
): NormalizedFormFields {
  return { ...fuzzy, ...explicit };
}

export function buildActivityTitle(fields: NormalizedFormFields): string {
  const displayName = fields.clientName?.trim() || fields.childName?.trim() || 'לקוח';
  const pkg = fields.packageName?.trim();
  if (fields.activityTitle?.trim()) return fields.activityTitle.trim();
  return pkg ? `${pkg} - ${displayName}` : `אירוע יום הולדת - ${displayName}`;
}

export function buildActivityNotes(
  fields: NormalizedFormFields,
  unmapped: Record<string, string> = {},
): string {
  const lines: string[] = [];
  if (fields.childName?.trim() && fields.childName !== fields.clientName) {
    lines.push(`ילד/ה: ${fields.childName.trim()}`);
  }
  if (fields.childAge?.trim()) lines.push(`גיל: ${fields.childAge.trim()}`);
  if (fields.participantsCount?.trim()) lines.push(`משתתפים: ${fields.participantsCount.trim()}`);
  if (fields.packageName?.trim()) lines.push(`חבילה: ${fields.packageName.trim()}`);
  if (fields.activityTime?.trim()) lines.push(`שעה: ${fields.activityTime.trim()}`);
  if (fields.notes?.trim()) lines.push(fields.notes.trim());
  for (const [key, val] of Object.entries(unmapped)) {
    lines.push(`${key}: ${val}`);
  }
  lines.push('מקור: Forms.app');
  return lines.join('\n');
}

export function buildCategoryInputs(
  categories: Array<{ id: string; name: string; isActive?: boolean; valueType?: string; metricRole?: string }>,
  fields: NormalizedFormFields,
): Record<string, string> {
  const clientName = fields.clientName?.trim() || fields.childName?.trim() || '';
  const inputs: Record<string, string> = {};

  for (const cat of categories) {
    if (cat.isActive === false) continue;
    const name = cat.name;

    if (CLIENT_CATEGORY_NAMES.some((n) => name.includes(n)) && clientName) {
      inputs[cat.id] = clientName;
    }
    if (CHILD_COUNT_CATEGORY_NAMES.some((n) => name.includes(n)) && fields.participantsCount?.trim()) {
      inputs[cat.id] = fields.participantsCount.trim();
    }
    if (name.includes('גיל') && fields.childAge?.trim()) {
      inputs[cat.id] = fields.childAge.trim();
    }
    if (name.includes('מיקום') && fields.location?.trim() && cat.valueType === 'text') {
      inputs[cat.id] = fields.location.trim();
    }
    if (fields.amount && cat.metricRole === 'revenue' && cat.valueType === 'number') {
      inputs[cat.id] = fields.amount.replace(/[^\d.]/g, '');
    }
  }

  return inputs;
}

export function buildEventValuesForCategories(
  eventId: string,
  businessId: string,
  userId: string,
  categories: Array<{ id: string; name: string; isActive?: boolean; valueType?: string; metricRole?: string }>,
  categoryInputs: Record<string, string>,
  existing: Array<{ id: string; eventId: string; categoryId: string; businessId: string; userId: string; metricRole: string; valueText?: string; valueNumber?: number; valueDate?: string; revenueValue?: number; expenseValue?: number }> = [],
) {
  return categories
    .filter((c) => c.isActive !== false)
    .map((cat) => {
      const raw = categoryInputs[cat.id]?.trim() ?? '';
      const existingVal = existing.find((ev) => ev.eventId === eventId && ev.categoryId === cat.id);
      const base = existingVal ?? {
        id: crypto.randomUUID(),
        eventId,
        categoryId: cat.id,
        businessId,
        userId,
        metricRole: cat.metricRole ?? 'neutral',
      };

      if (!raw) return base;

      const updated = { ...base };
      switch (cat.valueType) {
        case 'number': {
          const num = Number(raw.replace(/[^\d.]/g, ''));
          if (Number.isFinite(num)) {
            updated.valueNumber = num;
            if (cat.metricRole === 'revenue') updated.revenueValue = num;
            if (cat.metricRole === 'expense') updated.expenseValue = num;
          }
          break;
        }
        case 'date':
          updated.valueDate = raw;
          break;
        case 'duration': {
          const mins = Number(raw);
          if (Number.isFinite(mins)) (updated as { valueDuration?: number }).valueDuration = mins;
          break;
        }
        default:
          updated.valueText = raw;
      }
      return updated;
    });
}

export function collectUnmappedFields(
  parsed: Record<string, string>,
  normalized: NormalizedFormFields,
  mappings: FieldMappingRow[],
): Record<string, string> {
  const mappedLabels = new Set(mappings.map((m) => normKey(m.externalField)));
  const usedValues = new Set(
    Object.values(normalized)
      .filter((v) => typeof v === 'string' && v.trim())
      .map((v) => v!.trim()),
  );
  const unmapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    const v = value.trim();
    if (!v) continue;
    if (mappedLabels.has(normKey(key))) continue;
    if (usedValues.has(v)) continue;
    unmapped[key] = v;
  }
  return unmapped;
}
