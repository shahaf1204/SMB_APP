import type { OperatingModel } from '../types/workspace';

/** Semantic insight category — not shown in Hebrew UI */
export type BusinessInsightType =
  | 'warning'
  | 'opportunity'
  | 'reminder'
  | 'success'
  | 'info';

/** Sort weight — not shown in Hebrew UI */
export type BusinessInsightPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'positive';

/** Lucide icon keys resolved in UI — not shown in Hebrew UI */
export type BusinessInsightIcon =
  | 'TriangleAlert'
  | 'Lightbulb'
  | 'Clock3'
  | 'CircleCheck'
  | 'Info';

export type BusinessInsightEntityType = 'engagement' | 'client' | 'invoice';

export interface BusinessInsight {
  id: string;
  type: BusinessInsightType;
  priority: BusinessInsightPriority;
  title: string;
  description: string;
  actionLabel?: string;
  actionTarget?: string;
  icon: BusinessInsightIcon;
  relatedEntityId?: string;
  relatedEntityType?: BusinessInsightEntityType;
  operatingModel: OperatingModel;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface BusinessCoachData {
  engagements: import('../types/models').Engagement[];
  engagementSessions: import('../types/models').EngagementSession[];
}

export interface GenerateBusinessInsightsInput {
  workspaceConfig: import('../types/workspace').BusinessWorkspaceConfig;
  data: BusinessCoachData;
  now?: Date;
}

/**
 * Future extension point: AI-generated insights will implement this shape
 * and be merged with rule-based insights via `combineInsightSources`.
 */
export interface InsightSource {
  id: string;
  generate(input: GenerateBusinessInsightsInput): BusinessInsight[];
}
