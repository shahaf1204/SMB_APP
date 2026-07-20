import type { LucideIcon } from 'lucide-react';
import type { ActivityPresentationType } from '../components/business/ActivityCard';

/** How the business delivers service — distinct from industry businessType */
export type OperatingModel =
  | 'event'
  | 'appointment'
  | 'journey'
  | 'package'
  | 'recurring'
  | 'project'
  | 'hybrid';

export interface WorkspaceTerminology {
  activitySingular: string;
  activityPlural: string;
  clientSingular: string;
  clientPlural: string;
}

export interface BusinessWorkspaceConfig {
  /** Industry preset id or custom label — optional mirror of business.presetId */
  businessType?: string;
  primaryOperatingModel: OperatingModel;
  enabledOperatingModels: OperatingModel[];
  onboardingCompleted: boolean;
  terminology?: Partial<WorkspaceTerminology>;
  defaultWorkflowTemplateId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivitiesGroupingMode =
  | 'date'
  | 'agenda'
  | 'status_and_next_action'
  | 'usage_and_expiration'
  | 'recurrence'
  | 'deadline_and_stage'
  | 'mixed';

export type WorkspaceQuickActionId =
  | 'new_event'
  | 'new_appointment'
  | 'new_journey'
  | 'new_package'
  | 'new_recurring'
  | 'new_project'
  | 'new_activity'
  | 'client'
  | 'invoice'
  | 'task'
  | 'use_session'
  | 'participant'
  | 'attendance'
  | 'new_meeting';

export type ActivityFormFieldId =
  | 'title'
  | 'client'
  | 'date'
  | 'start_time'
  | 'end_time'
  | 'duration'
  | 'location'
  | 'online'
  | 'amount'
  | 'deposit'
  | 'notes'
  | 'expected_end_date'
  | 'session_count'
  | 'total_value'
  | 'workflow_template'
  | 'package_name'
  | 'session_count_package'
  | 'expiration_date'
  | 'recurrence_pattern'
  | 'participants'
  | 'billing'
  | 'deadline'
  | 'workflow_stage';

export interface OperatingModelDefinition {
  id: OperatingModel;
  titleHe: string;
  descriptionHe: string;
  icon: LucideIcon;
  cardPresentation: ActivityPresentationType;
  groupingMode: ActivitiesGroupingMode;
  workflowStageIds: string[];
  recommendedFilterIds: string[];
  dashboardMetricIds: string[];
  quickActionIds: WorkspaceQuickActionId[];
  formFieldIds: ActivityFormFieldId[];
  defaultTerminology: WorkspaceTerminology;
}

export interface ResolvedWorkspaceConfig {
  workspace: BusinessWorkspaceConfig;
  primary: OperatingModelDefinition;
  enabled: OperatingModelDefinition[];
  terminology: WorkspaceTerminology;
  /** Resolved ActivityCard presentation for new activities */
  defaultCardPresentation: ActivityPresentationType;
  groupingMode: ActivitiesGroupingMode;
  activityFilterTabs: Array<{ id: string; label: string }>;
}
