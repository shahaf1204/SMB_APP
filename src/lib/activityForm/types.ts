import type { MetricRole, ValueType } from '../../types/models';
import type { CategoryTemplateSource } from '../../types/onboarding';
import type { OperatingModel } from '../../types/workspace';

/** User-facing priority tiers — not shown verbatim in default UI */
export type FieldPriority = 'core' | 'primary' | 'optional' | 'advanced';

/** Form section ids for activity creation */
export type FieldSection =
  | 'activity_details'
  | 'client'
  | 'business_details'
  | 'financial'
  | 'advanced'
  | 'notes';

/** Normalized field source for internal resolver logic */
export type FieldSource =
  | 'system'
  | 'business_recommended'
  | 'model_recommended'
  | 'user_added';

export type BuiltinFieldKey = 'title' | 'date' | 'location' | 'notes';

/** Unified field presentation — drives onboarding + production forms */
export interface ActivityFormFieldPresentation {
  key: string;
  label: string;
  valueType: ValueType;
  metricRole: MetricRole;
  required: boolean;
  locked: boolean;
  source: FieldSource;
  priority: FieldPriority;
  section: FieldSection;
  order: number;
  visibleByDefault: boolean;
  /** Built-in EventForm field instead of category row */
  builtin?: BuiltinFieldKey;
  /** Category id when resolved from persisted categories */
  categoryId?: string;
  placeholder?: string;
  helperText?: string;
}

export interface ActivityFormSchemaSection {
  id: FieldSection;
  titleHe: string;
  collapsedByDefault?: boolean;
  fields: ActivityFormFieldPresentation[];
}

export interface ActivityFormSchema {
  sections: ActivityFormSchemaSection[];
  /** Flat ordered fields for preview / tests */
  fields: ActivityFormFieldPresentation[];
}

export interface ResolveActivityFormSchemaInput {
  businessType?: string;
  operatingModel: OperatingModel;
}

export interface ResolveFromDraftsInput extends ResolveActivityFormSchemaInput {
  drafts: Array<{
    key: string;
    name: string;
    valueType: ValueType;
    metricRole: MetricRole;
    source: CategoryTemplateSource;
    isProtected: boolean;
    isRequired: boolean;
    enabled: boolean;
    sortOrder: number;
  }>;
}

export interface ResolveFromCategoriesInput extends ResolveActivityFormSchemaInput {
  categories: Array<{
    id: string;
    name: string;
    valueType: ValueType;
    metricRole: MetricRole;
    isActive: boolean;
    templateKey?: string;
    sortOrder?: number;
  }>;
}

export const SECTION_TITLES_HE: Record<FieldSection, string> = {
  activity_details: 'פרטי הפעילות',
  client: 'לקוח',
  business_details: 'פרטים נוספים',
  financial: 'תשלום',
  advanced: 'עוד פרטים',
  notes: 'הערות',
};

export const SECTION_ORDER: FieldSection[] = [
  'activity_details',
  'client',
  'business_details',
  'financial',
  'advanced',
  'notes',
];
