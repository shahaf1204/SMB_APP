import { CUSTOMER_SOURCE_CATEGORY_NAME } from './leadSources';
import type { Category, MetricRole, ValueType } from '../types/models';

export interface BusinessTypePreset {
  id: string;
  label: string;
  categories: Array<{
    name: string;
    valueType: ValueType;
    metricRole: MetricRole;
  }>;
}

const baseFinancial = [
  { name: 'סכום הכנסה', valueType: 'number' as const, metricRole: 'revenue' as const },
  { name: 'סכום הוצאה', valueType: 'number' as const, metricRole: 'expense' as const },
];

export const BUSINESS_TYPE_PRESETS: BusinessTypePreset[] = [
  {
    id: 'birthday',
    label: 'מפעיל/ת ימי הולדת',
    categories: [
      { name: 'שם לקוח', valueType: 'text', metricRole: 'neutral' },
      { name: 'מספר ילדים', valueType: 'number', metricRole: 'neutral' },
      { name: 'משך אירוע (שעות)', valueType: 'duration', metricRole: 'neutral' },
      ...baseFinancial,
    ],
  },
  {
    id: 'photographer',
    label: 'צלם/ה',
    categories: [
      { name: 'שם לקוח', valueType: 'text', metricRole: 'neutral' },
      { name: 'סוג צילום', valueType: 'text', metricRole: 'neutral' },
      { name: 'תאריך אספקה', valueType: 'date', metricRole: 'neutral' },
      ...baseFinancial,
    ],
  },
  {
    id: 'confectioner',
    label: 'קונדיטור/ית',
    categories: [
      { name: 'שם לקוח', valueType: 'text', metricRole: 'neutral' },
      { name: 'סוג מוצר', valueType: 'text', metricRole: 'neutral' },
      { name: 'כמות', valueType: 'number', metricRole: 'neutral' },
      ...baseFinancial,
    ],
  },
  {
    id: 'balloons',
    label: 'מעצב/ת בלונים',
    categories: [
      { name: 'שם לקוח', valueType: 'text', metricRole: 'neutral' },
      { name: 'סוג עיצוב', valueType: 'text', metricRole: 'neutral' },
      ...baseFinancial,
    ],
  },
  {
    id: 'therapist',
    label: 'מטפל/ת',
    categories: [
      { name: 'שם מטופל', valueType: 'text', metricRole: 'neutral' },
      { name: 'משך טיפול (דקות)', valueType: 'duration', metricRole: 'neutral' },
      ...baseFinancial,
    ],
  },
  {
    id: 'coach',
    label: 'מאמן/ת אישי/ת',
    categories: [
      { name: 'שם מתאמן', valueType: 'text', metricRole: 'neutral' },
      { name: 'מספר מפגשים', valueType: 'number', metricRole: 'neutral' },
      ...baseFinancial,
    ],
  },
  {
    id: 'tutor',
    label: 'מורה פרטי/ת',
    categories: [
      { name: 'שם תלמיד', valueType: 'text', metricRole: 'neutral' },
      { name: 'מקצוע', valueType: 'text', metricRole: 'neutral' },
      { name: 'שעות לימוד', valueType: 'duration', metricRole: 'neutral' },
      ...baseFinancial,
    ],
  },
  {
    id: 'consultant',
    label: 'יועץ/ת',
    categories: [
      { name: 'שם לקוח', valueType: 'text', metricRole: 'neutral' },
      { name: 'נושא ייעוץ', valueType: 'text', metricRole: 'neutral' },
      ...baseFinancial,
    ],
  },
  {
    id: 'freelance',
    label: 'עצמאי/ת כללי',
    categories: [
      { name: 'שם לקוח', valueType: 'text', metricRole: 'neutral' },
      { name: 'תיאור שירות', valueType: 'text', metricRole: 'neutral' },
      ...baseFinancial,
    ],
  },
];

const sourceCategory = {
  name: CUSTOMER_SOURCE_CATEGORY_NAME,
  valueType: 'text' as const,
  metricRole: 'neutral' as const,
};

export function buildCategoriesFromPreset(
  businessId: string,
  preset: BusinessTypePreset,
): Omit<Category, 'id'>[] {
  const mapped = preset.categories.map((c) => ({
    businessId,
    name: c.name,
    valueType: c.valueType,
    metricRole: c.metricRole,
    isActive: true,
  }));
  if (!mapped.some((c) => c.name === CUSTOMER_SOURCE_CATEGORY_NAME)) {
    mapped.splice(1, 0, { businessId, ...sourceCategory, isActive: true });
  }
  return mapped;
}

export function buildGenericCategories(businessId: string): Omit<Category, 'id'>[] {
  return buildCategoriesFromPreset(businessId, BUSINESS_TYPE_PRESETS[8]);
}
