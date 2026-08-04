import {
  BUSINESS_TYPE_CATEGORY_TEMPLATES,
  CORE_CATEGORY_TEMPLATES,
  OPERATING_MODEL_CATEGORY_TEMPLATES,
} from '../../config/categoryTemplates';
import type {
  CategoryTemplate,
  OnboardingCategoryDraft,
  ResolveRecommendedCategoriesInput,
} from '../../types/onboarding';
import type { Category } from '../../types/models';
import type { OperatingModel } from '../../types/workspace';
import { withCategorySortOrders } from '../categories';

function mergeTemplates(...groups: CategoryTemplate[][]): CategoryTemplate[] {
  const byKey = new Map<string, CategoryTemplate>();

  for (const group of groups) {
    for (const tpl of group) {
      const existing = byKey.get(tpl.key);
      if (!existing) {
        byKey.set(tpl.key, tpl);
        continue;
      }
      // Prefer higher-specificity sources
      const rank: Record<CategoryTemplate['source'], number> = {
        core: 5,
        business_type: 4,
        operating_model: 3,
        generic: 2,
        manual: 1,
      };
      if (rank[tpl.source] > rank[existing.source]) {
        byKey.set(tpl.key, { ...tpl, isProtected: existing.isProtected || tpl.isProtected });
      }
    }
  }

  return [...byKey.values()].sort(
    (a, b) => (a.sortPriority ?? 500) - (b.sortPriority ?? 500),
  );
}

function modelsForInput(
  primary: OperatingModel,
  enabled: OperatingModel[],
): Exclude<OperatingModel, 'hybrid'>[] {
  const set = new Set<Exclude<OperatingModel, 'hybrid'>>();
  if (primary !== 'hybrid') set.add(primary);
  for (const m of enabled) {
    if (m !== 'hybrid') set.add(m);
  }
  if (primary === 'hybrid' && set.size === 0) {
    return ['event', 'appointment'];
  }
  return [...set];
}

/**
 * Central category recommendation resolver.
 * Merges core, business-type, and operating-model templates; dedupes by semantic key.
 */
export function resolveRecommendedCategories(
  input: ResolveRecommendedCategoriesInput,
): CategoryTemplate[] {
  const presetId = input.presetId ?? input.businessType;
  const models = modelsForInput(
    input.primaryOperatingModel,
    input.enabledOperatingModels,
  );

  const modelTemplates = models.flatMap(
    (m) => OPERATING_MODEL_CATEGORY_TEMPLATES[m] ?? [],
  );

  const businessTemplates = presetId
    ? BUSINESS_TYPE_CATEGORY_TEMPLATES[presetId] ?? []
    : [];

  return mergeTemplates(
    CORE_CATEGORY_TEMPLATES,
    businessTemplates,
    modelTemplates,
  );
}

export function templatesToOnboardingDrafts(
  templates: CategoryTemplate[],
): OnboardingCategoryDraft[] {
  return templates.map((t, index) => ({
    key: t.key,
    name: t.name,
    valueType: t.valueType,
    metricRole: t.metricRole,
    source: t.source,
    isProtected: Boolean(t.isProtected),
    isRequired: Boolean(t.isRequired),
    enabled: true,
    sortOrder: t.sortPriority ?? index,
  }));
}

export function onboardingDraftsToCategoryDefs(
  businessId: string,
  drafts: OnboardingCategoryDraft[],
): Omit<Category, 'id'>[] {
  const enabled = drafts
    .filter((d) => d.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return withCategorySortOrders(
    enabled.map((d) => ({
      businessId,
      name: d.name.trim(),
      valueType: d.valueType,
      metricRole: d.metricRole,
      isActive: true,
      templateKey: d.key,
    })),
  );
}

/** Recompute recommendations while preserving user edits */
export function mergeDraftWithRecommendations(
  current: OnboardingCategoryDraft[],
  fresh: CategoryTemplate[],
): OnboardingCategoryDraft[] {
  const currentByKey = new Map(current.map((d) => [d.key, d]));
  const freshKeys = new Set(fresh.map((t) => t.key));

  const merged: OnboardingCategoryDraft[] = fresh.map((t, index) => {
    const existing = currentByKey.get(t.key);
    if (existing) {
      return {
        ...existing,
        source: t.source,
        isProtected: existing.isProtected || Boolean(t.isProtected),
      };
    }
    return {
      key: t.key,
      name: t.name,
      valueType: t.valueType,
      metricRole: t.metricRole,
      source: t.source,
      isProtected: Boolean(t.isProtected),
      isRequired: Boolean(t.isRequired),
      enabled: true,
      sortOrder: t.sortPriority ?? index,
    };
  });

  // Keep manually added categories not in fresh set
  for (const d of current) {
    if (!freshKeys.has(d.key) && d.source === 'manual') {
      merged.push(d);
    }
  }

  return merged
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((d, i) => ({ ...d, sortOrder: i }));
}
