import { useMemo } from 'react';
import { useWorkspaceConfig } from './useWorkspaceConfig';

/** Activities page adapter — workspace-driven filters, grouping, terminology */
export function useActivitiesWorkspace() {
  const config = useWorkspaceConfig();

  return useMemo(() => {
    if (!config) {
      return {
        primaryOperatingModel: 'hybrid' as const,
        enabledOperatingModels: [] as string[],
        groupingMode: 'mixed' as const,
        filterTabs: [] as Array<{ id: string; label: string }>,
        terminology: {
          activitySingular: 'פעילות',
          activityPlural: 'פעילויות',
          clientSingular: 'לקוח',
          clientPlural: 'לקוחות',
        },
        defaultCardPresentation: 'generic' as const,
        quickActionIds: [] as string[],
        formFieldIds: [] as string[],
        workflowStageIds: [] as string[],
        dashboardMetricIds: [] as string[],
      };
    }

    return {
      primaryOperatingModel: config.workspace.primaryOperatingModel,
      enabledOperatingModels: config.workspace.enabledOperatingModels,
      groupingMode: config.groupingMode,
      filterTabs: config.activityFilterTabs,
      terminology: config.terminology,
      defaultCardPresentation: config.defaultCardPresentation,
      quickActionIds: config.primary.quickActionIds,
      formFieldIds: config.primary.formFieldIds,
      workflowStageIds: config.primary.workflowStageIds,
      dashboardMetricIds: config.primary.dashboardMetricIds,
    };
  }, [config]);
}
