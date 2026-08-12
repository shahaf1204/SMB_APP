import { formCopyText } from '../../config/businessFormCopy';
import type { CategoryTemplateSource } from '../../types/onboarding';
import type { MetricRole, ValueType } from '../../types/models';
import {
  defaultEnabledForDraft,
  isClientCategoryKey,
  isSourceFieldKey,
  mapTemplateSourceToFieldSource,
  recommendedTitleHe,
  resolveFieldMeta,
  systemBuiltinFields,
} from './fieldMetadata';
import type {
  ActivityFormFieldPresentation,
  ActivityFormSchema,
  ActivityFormSchemaSection,
  FieldSection,
  ResolveActivityFormSchemaInput,
  ResolveFromCategoriesInput,
  ResolveFromDraftsInput,
} from './types';

export { SECTION_ORDER, SECTION_TITLES_HE } from './types';
export type {
  ActivityFormFieldPresentation,
  ActivityFormSchema,
  FieldPriority,
  FieldSection,
} from './types';

function sectionTitle(section: FieldSection): string {
  const titles: Record<FieldSection, string> = {
    activity_details: 'פרטי הפעילות',
    client: 'לקוח',
    business_details: 'פרטים נוספים',
    financial: 'תשלום',
    advanced: 'עוד פרטים',
    notes: 'הערות',
  };
  return titles[section];
}

function buildPresentation(params: {
  key: string;
  label: string;
  valueType: ValueType;
  metricRole: MetricRole;
  source: CategoryTemplateSource | 'manual';
  isProtected: boolean;
  isRequired: boolean;
  enabled: boolean;
  sortOrder: number;
  categoryId?: string;
  input: ResolveActivityFormSchemaInput;
}): ActivityFormFieldPresentation | null {
  const meta = resolveFieldMeta(params.key, params.label, params.metricRole, params.isProtected);

  if (meta.bindsToBuiltin && meta.bindsToBuiltin !== 'notes') {
    return null;
  }

  if (!params.enabled) return null;

  const placeholder =
    params.key === '__builtin_title' || meta.bindsToBuiltin === undefined
      ? formCopyText(
          {
            businessType: params.input.businessType,
            operatingModel: params.input.operatingModel,
            fieldKey: 'title',
          },
          'placeholder',
        ) || undefined
      : undefined;

  return {
    key: params.key,
    label: params.label,
    valueType: params.valueType,
    metricRole: params.metricRole,
    required: params.isRequired || params.isProtected,
    locked: Boolean(params.isProtected || meta.locked),
    source: mapTemplateSourceToFieldSource(params.source, params.source === 'manual'),
    priority: meta.priority,
    section: meta.section,
    order: params.sortOrder,
    visibleByDefault: meta.visibleByDefault && params.enabled,
    builtin: meta.bindsToBuiltin,
    categoryId: params.categoryId,
    placeholder,
  };
}

function groupIntoSections(
  fields: ActivityFormFieldPresentation[],
): ActivityFormSchemaSection[] {
  const order: FieldSection[] = [
    'activity_details',
    'client',
    'business_details',
    'financial',
    'advanced',
    'notes',
  ];

  const bySection = new Map<FieldSection, ActivityFormFieldPresentation[]>();
  for (const f of fields) {
    const list = bySection.get(f.section) ?? [];
    list.push(f);
    bySection.set(f.section, list);
  }

  return order
    .map((id) => {
      const sectionFields = (bySection.get(id) ?? []).sort((a, b) => a.order - b.order);
      if (!sectionFields.length) return null;
      return {
        id,
        titleHe: sectionTitle(id),
        collapsedByDefault: id === 'advanced' || id === 'notes',
        fields: sectionFields,
      };
    })
    .filter(Boolean) as ActivityFormSchemaSection[];
}

function appendBuiltins(
  fields: ActivityFormFieldPresentation[],
  input: ResolveActivityFormSchemaInput,
  hasLocationCategory: boolean,
): ActivityFormFieldPresentation[] {
  const builtins = systemBuiltinFields();
  const result: ActivityFormFieldPresentation[] = [...fields];

  for (const b of builtins) {
    result.push({
      key: b.key,
      label: b.label,
      valueType: b.key === '__builtin_date' ? 'date' : 'text',
      metricRole: 'neutral',
      required: b.priority === 'core',
      locked: true,
      source: 'system',
      priority: b.priority,
      section: b.section,
      order: b.order ?? 0,
      visibleByDefault: true,
      builtin: b.builtin,
      placeholder: formCopyText(
        {
          businessType: input.businessType,
          operatingModel: input.operatingModel,
          fieldKey: 'title',
        },
        'placeholder',
      ) || undefined,
    });
  }

  if (!hasLocationCategory) {
    result.push({
      key: '__builtin_location',
      label: 'מיקום',
      valueType: 'text',
      metricRole: 'neutral',
      required: false,
      locked: false,
      source: 'system',
      priority: 'primary',
      section: 'activity_details',
      order: 45,
      visibleByDefault: true,
      builtin: 'location',
    });
  }

  result.push({
    key: '__builtin_notes',
    label: 'הערות',
    valueType: 'text',
    metricRole: 'neutral',
    required: false,
    locked: false,
    source: 'system',
    priority: 'optional',
    section: 'notes',
    order: 960,
    visibleByDefault: true,
    builtin: 'notes',
  });

  return result;
}

/** Resolve schema from onboarding drafts (before business exists) */
export function resolveActivityFormSchemaFromDrafts(
  input: ResolveFromDraftsInput,
): ActivityFormSchema {
  const enabled = [...input.drafts]
    .filter((d) => d.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const hasLocationCategory = enabled.some(
    (d) => d.key === 'event_location' || d.key === 'appt_location' || d.key === 'shoot_location',
  );

  const categoryFields: ActivityFormFieldPresentation[] = [];
  for (const d of enabled) {
    if (isClientCategoryKey(d.key, d.name)) {
      categoryFields.push({
        key: d.key,
        label: d.name,
        valueType: d.valueType,
        metricRole: d.metricRole,
        required: true,
        locked: true,
        source: mapTemplateSourceToFieldSource(d.source),
        priority: 'core',
        section: 'client',
        order: d.sortOrder,
        visibleByDefault: true,
      });
      continue;
    }

    const row = buildPresentation({
      key: d.key,
      label: d.name,
      valueType: d.valueType,
      metricRole: d.metricRole,
      source: d.source,
      isProtected: d.isProtected,
      isRequired: d.isRequired,
      enabled: d.enabled,
      sortOrder: d.sortOrder,
      input,
    });
    if (row) categoryFields.push(row);
  }

  const withBuiltins = appendBuiltins(categoryFields, input, hasLocationCategory);
  const sections = groupIntoSections(withBuiltins);

  return { sections, fields: withBuiltins.sort((a, b) => a.order - b.order) };
}

/** Resolve schema from persisted categories (production form) */
export function resolveActivityFormSchemaFromCategories(
  input: ResolveFromCategoriesInput,
): ActivityFormSchema {
  const active = [...input.categories]
    .filter((c) => c.isActive)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const hasLocationCategory = active.some(
    (c) =>
      c.templateKey === 'event_location' ||
      c.templateKey === 'appt_location' ||
      c.templateKey === 'shoot_location',
  );

  const categoryFields: ActivityFormFieldPresentation[] = [];
  for (const c of active) {
    const key = c.templateKey ?? c.id;
    if (isClientCategoryKey(key, c.name)) {
      categoryFields.push({
        key,
        label: c.name,
        valueType: c.valueType,
        metricRole: c.metricRole,
        required: true,
        locked: true,
        source: 'system',
        priority: 'core',
        section: 'client',
        order: c.sortOrder ?? 0,
        visibleByDefault: true,
        categoryId: c.id,
      });
      continue;
    }

    if (isSourceFieldKey(key, c.name)) {
      const meta = resolveFieldMeta(key, c.name, c.metricRole, false);
      categoryFields.push({
        key,
        label: c.name,
        valueType: c.valueType,
        metricRole: c.metricRole,
        required: false,
        locked: false,
        source: 'system',
        priority: meta.priority,
        section: 'advanced',
        order: c.sortOrder ?? 0,
        visibleByDefault: meta.visibleByDefault,
        categoryId: c.id,
      });
      continue;
    }

    const meta = resolveFieldMeta(key, c.name, c.metricRole, false);
    if (meta.bindsToBuiltin && meta.bindsToBuiltin !== 'notes') continue;

    categoryFields.push({
      key,
      label: c.name,
      valueType: c.valueType,
      metricRole: c.metricRole,
      required: false,
      locked: Boolean(meta.locked),
      source: key.startsWith('manual-') ? 'user_added' : 'model_recommended',
      priority: meta.priority,
      section: meta.section,
      order: c.sortOrder ?? 0,
      visibleByDefault: meta.visibleByDefault,
      categoryId: c.id,
      builtin: meta.bindsToBuiltin,
    });
  }

  const withBuiltins = appendBuiltins(categoryFields, input, hasLocationCategory);
  const sections = groupIntoSections(withBuiltins);

  return { sections, fields: withBuiltins.sort((a, b) => a.order - b.order) };
}

/** Convenience alias */
export function resolveActivityFormSchema(
  workspaceConfig: ResolveActivityFormSchemaInput & { categories?: ResolveFromCategoriesInput['categories'] },
  drafts?: ResolveFromDraftsInput['drafts'],
): ActivityFormSchema {
  if (drafts?.length) {
    return resolveActivityFormSchemaFromDrafts({ ...workspaceConfig, drafts });
  }
  return resolveActivityFormSchemaFromCategories({
    ...workspaceConfig,
    categories: workspaceConfig.categories ?? [],
  });
}

/** Fields visible in simplified onboarding recommended section */
export function partitionDraftsForOnboarding(
  drafts: ResolveFromDraftsInput['drafts'],
  input: ResolveActivityFormSchemaInput,
) {
  const coreKeys = new Set(['client_name']);

  const recommended: typeof drafts = [];
  const more: typeof drafts = [];
  const coreCategories: typeof drafts = [];

  for (const d of drafts) {
    const meta = resolveFieldMeta(d.key, d.name, d.metricRole, d.isProtected);
    if (coreKeys.has(d.key) || d.isProtected && meta.priority === 'core') {
      if (d.key === 'client_name') coreCategories.push(d);
      continue;
    }
    if (meta.bindsToBuiltin && meta.bindsToBuiltin !== 'notes') continue;
    if (meta.priority === 'advanced' || meta.priority === 'optional' && !meta.visibleByDefault) {
      more.push(d);
    } else if (meta.priority === 'primary' || (meta.priority === 'optional' && meta.visibleByDefault)) {
      recommended.push(d);
    } else if (meta.priority === 'core' && d.key !== 'client_name') {
      continue;
    } else {
      more.push(d);
    }
  }

  return {
    coreSummaryLabels: ['שם הפעילות', 'לקוח', 'תאריך'],
    coreCategories,
    recommended: recommended.sort((a, b) => a.sortOrder - b.sortOrder),
    more: more.sort((a, b) => a.sortOrder - b.sortOrder),
    recommendedTitle: recommendedTitleHe(input.businessType, input.operatingModel),
  };
}

/** Default enabled state when fresh recommendations are applied */
export function applyDefaultEnabledToDrafts(
  drafts: ResolveFromDraftsInput['drafts'],
): ResolveFromDraftsInput['drafts'] {
  return drafts.map((d) => {
    const meta = resolveFieldMeta(d.key, d.name, d.metricRole, d.isProtected);
    if (d.isProtected) return { ...d, enabled: true };
    if (d.source === 'manual') return d;
    return { ...d, enabled: defaultEnabledForDraft(d.key, meta) };
  });
}

/** Preview rows for onboarding — max 5 representative fields */
export function buildOnboardingPreviewRows(schema: ActivityFormSchema): Array<{ label: string; placeholder: string }> {
  const prefer = ['__builtin_title', '__builtin_date', 'client_name', '__builtin_location', 'total_amount'];
  const rows: Array<{ label: string; placeholder: string }> = [];

  for (const key of prefer) {
    const field = schema.fields.find((f) => {
      if (f.key === key) return true;
      if (key === '__builtin_title' && f.builtin === 'title') return true;
      if (key === '__builtin_date' && f.builtin === 'date') return true;
      if (key === '__builtin_location' && f.builtin === 'location') return true;
      return false;
    });
    if (!field) continue;
    rows.push({
      label: field.label,
      placeholder: field.placeholder ?? placeholderForField(field.label),
    });
    if (rows.length >= 5) break;
  }

  if (rows.length < 4) {
    for (const f of schema.fields) {
      if (rows.some((r) => r.label === f.label)) continue;
      if (f.section === 'advanced') continue;
      rows.push({ label: f.label, placeholder: placeholderForField(f.label) });
      if (rows.length >= 5) break;
    }
  }

  return rows.slice(0, 5);
}

function placeholderForField(label: string): string {
  if (label.includes('תאריך')) return '01/01/2026';
  if (label.includes('סכום') || label.includes('מחיר')) return '₪0';
  if (label.includes('מיקום') || label.includes('לוקיישן')) return 'תל אביב';
  if (label.includes('לקוח')) return 'דנה כהן';
  return '…';
}

/** Visible expanded fields count target for production form */
export function countDefaultVisibleFields(schema: ActivityFormSchema): number {
  return schema.sections
    .filter((s) => !s.collapsedByDefault)
    .reduce((n, s) => n + s.fields.filter((f) => f.visibleByDefault).length, 0);
}
