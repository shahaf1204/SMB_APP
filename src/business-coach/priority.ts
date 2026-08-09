import type { BusinessInsight, BusinessInsightPriority } from './types';

const PRIORITY_RANK: Record<BusinessInsightPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  positive: 4,
};

export function compareInsightPriority(
  a: BusinessInsightPriority,
  b: BusinessInsightPriority,
): number {
  return PRIORITY_RANK[a] - PRIORITY_RANK[b];
}

export function sortInsights(insights: BusinessInsight[]): BusinessInsight[] {
  return [...insights].sort(
    (a, b) => compareInsightPriority(a.priority, b.priority),
  );
}

export function limitInsights(
  insights: BusinessInsight[],
  max = 3,
): BusinessInsight[] {
  return sortInsights(insights).slice(0, max);
}

/**
 * Remove lower-priority insights that reference the same engagement
 * when a higher-priority insight already covers it.
 */
export function dedupeInsightsByEntity(
  insights: BusinessInsight[],
): BusinessInsight[] {
  const claimedEntityIds = new Set<string>();
  const result: BusinessInsight[] = [];

  for (const insight of sortInsights(insights)) {
    const entityId = insight.relatedEntityId;
    if (entityId && claimedEntityIds.has(entityId)) {
      continue;
    }

    const relatedIds = insight.metadata?.relatedEngagementIds;
    if (Array.isArray(relatedIds)) {
      const overlaps = relatedIds.some(
        (id) => typeof id === 'string' && claimedEntityIds.has(id),
      );
      if (overlaps && insight.priority !== 'critical') {
        continue;
      }
      for (const id of relatedIds) {
        if (typeof id === 'string') claimedEntityIds.add(id);
      }
    }

    if (entityId) claimedEntityIds.add(entityId);
    result.push(insight);
  }

  return sortInsights(result);
}

/**
 * Future: merge rule-based and AI insight arrays without duplicates.
 * AI is not implemented — this is the stable merge contract.
 */
export function combineInsightSources(
  ...sources: BusinessInsight[][]
): BusinessInsight[] {
  return dedupeInsightsByEntity(sources.flat());
}
