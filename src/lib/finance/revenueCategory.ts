import {
  CORE_CATEGORY_TEMPLATES,
  OPERATING_MODEL_CATEGORY_TEMPLATES,
} from '../../config/categoryTemplates';
import type { Category } from '../../types/models';
import type { OperatingModel } from '../../types/workspace';
import { getOperatingModelFinancialField } from './operatingModelFinancialField';

/** Exact Hebrew names for legacy category backfill (fallback only). */
export const REVENUE_CATEGORY_NAMES = new Set([
  'סכום האירוע',
  'סכום כולל',
  'סכום הכנסה',
  'מחיר הפגישה',
  'ערך התהליך',
  'מחיר החבילה',
  'ערך הפרויקט',
  'מחיר',
  'חיוב קבוע',
  'מקדמה',
  'יתרה לתשלום',
]);

const EXPENSE_CATEGORY_NAMES = new Set([
  'סכום הוצאה',
  'הוצאה',
  'עלות',
  'הוצאה משויכת',
]);

function templateNameByKey(key: string): string | undefined {
  for (const tpl of CORE_CATEGORY_TEMPLATES) {
    if (tpl.key === key) return tpl.name;
  }
  for (const group of Object.values(OPERATING_MODEL_CATEGORY_TEMPLATES)) {
    for (const tpl of group) {
      if (tpl.key === key) return tpl.name;
    }
  }
  return undefined;
}

/** Find the primary revenue category for an operating model. */
export function findRevenueCategory(
  categories: Category[],
  model: OperatingModel,
): Category | undefined {
  const field = getOperatingModelFinancialField(model);
  const active = categories.filter((c) => c.isActive);

  for (const key of field.templateKeys) {
    const byKey = active.find((c) => c.templateKey === key);
    if (byKey) return byKey;
    const name = templateNameByKey(key);
    if (name) {
      const byName = active.find((c) => c.name.trim() === name);
      if (byName) return byName;
    }
  }

  return active.find((c) => c.metricRole === 'revenue' && c.valueType === 'number');
}

/** Find client-name category for event value population. */
export function findClientNameCategory(categories: Category[]): Category | undefined {
  const names = ['שם לקוח', 'לקוח', 'שם מטופל', 'שם מתאמן', 'שם תלמיד'];
  return categories.find(
    (c) => c.isActive && names.some((n) => c.name.includes(n) || n.includes(c.name)),
  );
}

/**
 * Backfill missing metricRole on known financial categories only.
 * Does not overwrite explicit non-neutral roles or classify arbitrary numeric fields.
 */
export function backfillCategoryMetricRoles(categories: Category[]): Category[] {
  let changed = false;
  const updated = categories.map((cat) => {
    if (cat.metricRole !== 'neutral') return cat;

    const key = cat.templateKey;
    if (key) {
      for (const tpl of CORE_CATEGORY_TEMPLATES) {
        if (tpl.key === key && tpl.metricRole !== 'neutral') {
          changed = true;
          return { ...cat, metricRole: tpl.metricRole };
        }
      }
      for (const group of Object.values(OPERATING_MODEL_CATEGORY_TEMPLATES)) {
        for (const tpl of group) {
          if (tpl.key === key && tpl.metricRole !== 'neutral') {
            changed = true;
            return { ...cat, metricRole: tpl.metricRole };
          }
        }
      }
    }

    const name = cat.name.trim();
    if (REVENUE_CATEGORY_NAMES.has(name) && cat.valueType === 'number') {
      changed = true;
      return { ...cat, metricRole: 'revenue' as const };
    }
    if (EXPENSE_CATEGORY_NAMES.has(name) && cat.valueType === 'number') {
      changed = true;
      return { ...cat, metricRole: 'expense' as const };
    }

    return cat;
  });

  return changed ? updated : categories;
}
