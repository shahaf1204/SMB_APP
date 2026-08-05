import type {
  ActivityPresentationType,
  ActivityStatus,
} from '../../components/business/ActivityCard';
import type { Engagement, EngagementKind, Event } from '../../types/models';

export type ActivitySource = 'event' | 'engagement';

export type ActivityGroupId = string;

export type ActivityFilterId =
  | 'all'
  | 'needs_attention'
  | 'today'
  | 'this_week'
  | 'upcoming'
  | 'active'
  | 'waiting'
  | 'completed'
  | 'low_remaining'
  | 'expiring_soon'
  | 'in_progress'
  | 'upcoming_deadlines'
  | 'paused'
  | 'presentation_event'
  | 'presentation_appointment'
  | 'presentation_journey'
  | 'presentation_package'
  | 'presentation_recurring'
  | 'presentation_project';

/** Unified activity row for grouping, search and ActivityCard mapping */
export interface ActivityRecord {
  id: string;
  sourceId: string;
  source: ActivitySource;
  engagementKind?: EngagementKind;
  presentationType: ActivityPresentationType;
  title: string;
  clientName: string;
  location?: string;
  sortDate: string;
  endDate?: string;
  status: ActivityStatus;
  stage?: string;
  amount?: number;
  href: string;
  event?: Event;
  engagement?: Engagement;
  tags: string[];
  needsAttention: boolean;
  /** Precomputed for card mapping */
  contextualLabel?: string | null;
  usageLabel?: string | null;
  deadlineLabel?: string | null;
  recurrenceLabel?: string | null;
  nextOccurrenceLabel?: string | null;
  progressPercent?: number | null;
  progressDetail?: string | null;
  paymentStatus?: 'unpaid' | 'partial' | 'paid' | 'overdue' | null;
  phone?: string;
}

export interface ActivityGroupDefinition {
  id: ActivityGroupId;
  title: string;
  context?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface ActivitiesGroupingConfig {
  primaryModel: string;
  groups: ActivityGroupDefinition[];
}

export interface ActivityFilterChip {
  id: ActivityFilterId;
  label: string;
}

export interface ActivitiesPageCopy {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyCta: string;
}
