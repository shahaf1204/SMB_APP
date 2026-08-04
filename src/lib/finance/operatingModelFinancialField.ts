import type { MetricRole, ValueType } from '../../types/models';
import type { OperatingModel } from '../../types/workspace';

export type FinancialSemanticKey = 'revenueAmount';
export type FinancialDateSource = 'activityDate';

export interface OperatingModelFinancialField {
  label: string;
  semanticKey: FinancialSemanticKey;
  metricRole: MetricRole;
  valueType: ValueType;
  dateSource: FinancialDateSource;
  /** Category template keys tried in order */
  templateKeys: string[];
}

const REVENUE_FIELD: Omit<OperatingModelFinancialField, 'label' | 'templateKeys'> = {
  semanticKey: 'revenueAmount',
  metricRole: 'revenue',
  valueType: 'number',
  dateSource: 'activityDate',
};

const FIELDS: Record<Exclude<OperatingModel, 'hybrid'>, OperatingModelFinancialField> = {
  event: {
    ...REVENUE_FIELD,
    label: 'סכום האירוע',
    templateKeys: ['total_amount', 'revenue_amount'],
  },
  appointment: {
    ...REVENUE_FIELD,
    label: 'מחיר הפגישה',
    templateKeys: ['appt_price', 'revenue_amount'],
  },
  journey: {
    ...REVENUE_FIELD,
    label: 'ערך התהליך',
    templateKeys: ['journey_value', 'revenue_amount'],
  },
  package: {
    ...REVENUE_FIELD,
    label: 'מחיר החבילה',
    templateKeys: ['package_price', 'revenue_amount'],
  },
  recurring: {
    ...REVENUE_FIELD,
    label: 'מחיר',
    templateKeys: ['recurring_price', 'revenue_amount'],
  },
  project: {
    ...REVENUE_FIELD,
    label: 'ערך הפרויקט',
    templateKeys: ['project_value', 'revenue_amount'],
  },
};

export function getOperatingModelFinancialField(
  model: OperatingModel,
): OperatingModelFinancialField {
  if (model === 'hybrid') return FIELDS.event;
  return FIELDS[model];
}

export function engagementKindToOperatingModel(
  kind: 'project' | 'session_pack' | 'recurring_group',
  preferred?: OperatingModel,
): Exclude<OperatingModel, 'hybrid'> {
  if (kind === 'session_pack') return 'package';
  if (kind === 'recurring_group') return 'recurring';
  if (preferred === 'journey') return 'journey';
  return 'project';
}
