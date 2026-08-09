import type { BusinessInsight, GenerateBusinessInsightsInput } from './types';
import { generatePackageInsightsFromWorkspace } from './packageInsights';
import { combineInsightSources } from './priority';

/** Rule-based insight source — stable contract for future AI merge. */
const RULE_INSIGHT_SOURCE = {
  id: 'rules',
  generate(input: GenerateBusinessInsightsInput): BusinessInsight[] {
    const { workspaceConfig, data, now } = input;
    const primary = workspaceConfig.primaryOperatingModel;

    if (primary === 'package') {
      return generatePackageInsightsFromWorkspace(
        workspaceConfig,
        data.engagements,
        data.engagementSessions,
        now,
      );
    }

    return [];
  },
};

/**
 * Generate business insights for the active workspace.
 *
 * Future: pass additional `InsightSource` instances (e.g. AI) to
 * `combineInsightSources` without changing UI components.
 */
export function generateBusinessInsights(
  input: GenerateBusinessInsightsInput,
): BusinessInsight[] {
  const ruleInsights = RULE_INSIGHT_SOURCE.generate(input);
  return combineInsightSources(ruleInsights);
}

/** Stubs — return empty arrays; no production UI for these models yet. */
export function generateEventInsights(): BusinessInsight[] {
  return [];
}

export function generateAppointmentInsights(): BusinessInsight[] {
  return [];
}

export function generateJourneyInsights(): BusinessInsight[] {
  return [];
}

export function generateProjectInsights(): BusinessInsight[] {
  return [];
}

export function generateRecurringInsights(): BusinessInsight[] {
  return [];
}

export function generateHybridInsights(): BusinessInsight[] {
  return [];
}
