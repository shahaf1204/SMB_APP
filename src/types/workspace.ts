import type { LucideIcon } from 'lucide-react';
import type { ActivityPresentationType } from '../components/business/ActivityCard';
import type { StoredBusinessCapabilityProfile } from './businessArchitecture';

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
  /** ISO timestamp when onboarding was completed */
  onboardingCompletedAt?: string;
  terminology?: Partial<WorkspaceTerminology>;
  defaultWorkflowTemplateId?: string;
  /** Optional overrides for package-primary workspaces */
  packageSettings?: PackageWorkspaceSettings;
  /**
   * Explicit business capability profile (Phase 2A.1).
   * Lightweight activation + configuration status only.
   * Undefined = legacy mode — existing behavior preserved, no capability gating.
   *
   * MUST NOT store service catalogs, working hours, templates, or other capability payloads.
   */
  capabilityProfile?: StoredBusinessCapabilityProfile;
  /**
   * Future ref for defaults/templates bundle — not populated in Phase 2A.
   * See BusinessDefaultsProfile in businessArchitecture.ts.
   */
  defaultsProfileVersion?: 1;
  createdAt: string;
  updatedAt: string;
}

/** Configurable thresholds for package workspace dashboards and alerts */
export interface PackageWorkspaceSettings {
  /** Remaining sessions at or below this count trigger "low" alerts (default 3) */
  lowSessionsThreshold?: number;
  /** Days until expiration to flag "expiring soon" (default 14) */
  expiringDaysThreshold?: number;
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
