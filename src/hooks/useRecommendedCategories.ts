import { useMemo } from 'react';
import {
  resolveRecommendedCategories,
  templatesToOnboardingDrafts,
} from '../lib/categories/resolveRecommendedCategories';
import { useWorkspaceConfig } from './useWorkspaceConfig';

/** Recommended categories for current workspace — read-only */
export function useRecommendedCategories() {
  const config = useWorkspaceConfig();

  return useMemo(() => {
    if (!config) return [];
    const templates = resolveRecommendedCategories({
      presetId: config.workspace.businessType,
      businessType: config.workspace.businessType,
      primaryOperatingModel: config.workspace.primaryOperatingModel,
      enabledOperatingModels: config.workspace.enabledOperatingModels,
    });
    return templatesToOnboardingDrafts(templates);
  }, [config]);
}
