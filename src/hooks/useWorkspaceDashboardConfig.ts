import { useMemo } from 'react';
import {
  DASHBOARD_METRIC_LABELS_HE,
  QUICK_ACTION_LABELS_HE,
} from '../config/operatingModelConfig';
import { ONBOARDING_MODEL_CONTENT } from '../config/onboardingModelContent';
import { useWorkspaceConfig } from './useWorkspaceConfig';

/** Dashboard hero, metrics and quick actions from workspace */
export function useWorkspaceDashboardConfig() {
  const config = useWorkspaceConfig();

  return useMemo(() => {
    if (!config) {
      return {
        heroTitle: 'סיכום עסקי',
        metrics: [] as Array<{ id: string; label: string }>,
        quickActions: [] as Array<{ id: string; label: string }>,
        primaryActionLabel: 'פעילות חדשה',
        cardPresentation: 'generic' as const,
      };
    }

    const preview = ONBOARDING_MODEL_CONTENT[config.workspace.primaryOperatingModel].preview;

    return {
      heroTitle: preview.dashboard,
      primaryActionLabel: preview.primaryAction,
      viewLabel: preview.view,
      trackingLabel: preview.tracking,
      cardPresentation: config.defaultCardPresentation,
      metrics: config.primary.dashboardMetricIds.map((id) => ({
        id,
        label: DASHBOARD_METRIC_LABELS_HE[id] ?? id,
      })),
      quickActions: config.primary.quickActionIds.map((id) => ({
        id,
        label: QUICK_ACTION_LABELS_HE[id] ?? id,
      })),
    };
  }, [config]);
}
