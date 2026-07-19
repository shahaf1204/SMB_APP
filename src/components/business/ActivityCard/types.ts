import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  Camera,
  ClipboardList,
  FolderKanban,
  Layers,
  Repeat2,
  Route,
  TicketCheck,
} from 'lucide-react';

/** Operational condition — separate from payment and workflow stage */
export type ActivityStatus =
  | 'new'
  | 'active'
  | 'waiting'
  | 'completed'
  | 'cancelled'
  | 'needs_attention';

/** Financial state — never inferred from ActivityStatus */
export type ActivityPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export type ActivityCardVariant = 'compact' | 'standard' | 'hero' | 'timeline';

/**
 * Display presentation — how this activity should be visually composed.
 * Not the same as business type; supplied by parent adapter.
 */
export type ActivityPresentationType =
  | 'event'
  | 'appointment'
  | 'journey'
  | 'package'
  | 'project'
  | 'recurring'
  | 'generic';

export type ActivityQuickActionType = 'call' | 'navigate' | 'edit' | 'invoice' | 'open';

export interface ActivityQuickAction {
  type: ActivityQuickActionType;
  /** Accessible label (Hebrew) */
  label: string;
  onClick: () => void;
}

export interface ActivityCardProps {
  id: string;
  title: string;
  variant: ActivityCardVariant;
  /** How to compose visual hierarchy — defaults to generic */
  presentationType?: ActivityPresentationType;
  activityTypeLabel?: string | null;
  activityTypeIcon?: LucideIcon | null;
  clientName?: string | null;
  dateLabel?: string | null;
  timeLabel?: string | null;
  locationLabel?: string | null;
  amount?: number | string | null;
  currency?: string;
  status?: ActivityStatus | null;
  stage?: string | null;
  paymentStatus?: ActivityPaymentStatus | null;
  progressPercent?: number | null;
  progressLabel?: string | null;
  tags?: string[] | null;
  onClick?: (() => void) | null;
  quickActions?: ActivityQuickAction[] | null;
  /** Override default Hebrew status label */
  statusLabel?: string;
  /** Override default Hebrew payment label */
  paymentStatusLabel?: string;
  className?: string;
  /** Time/urgency context — e.g. "בעוד 5 ימים", "היום" */
  contextualLabel?: string | null;
  /** Next step — e.g. "הפגישה הבאה ב־22/07" */
  nextActionLabel?: string | null;
  /** Package usage — e.g. "7 מתוך 10 מפגשים נוצלו" */
  usageLabel?: string | null;
  /** Project deadline — e.g. "מסירה עד 18/07" */
  deadlineLabel?: string | null;
  /** Recurrence — e.g. "כל יום שלישי" */
  recurrenceLabel?: string | null;
  /** Next session date — e.g. "24/07" */
  nextOccurrenceLabel?: string | null;
  /** Journey/workflow detail — e.g. "מפגש 3 מתוך 8" */
  progressDetail?: string | null;
}

export const activityStatusLabels: Record<ActivityStatus, string> = {
  new: 'חדש',
  active: 'פעיל',
  waiting: 'ממתין',
  completed: 'הושלם',
  cancelled: 'בוטל',
  needs_attention: 'דורש טיפול',
};

export const paymentStatusLabels: Record<ActivityPaymentStatus, string> = {
  unpaid: 'לא שולם',
  partial: 'שולם חלקית',
  paid: 'שולם',
  overdue: 'באיחור',
};

/** Default Lucide icon when parent does not supply activityTypeIcon */
export const presentationDefaultIcons: Record<ActivityPresentationType, LucideIcon> = {
  event: CalendarDays,
  appointment: CalendarClock,
  journey: Route,
  package: TicketCheck,
  project: FolderKanban,
  recurring: Repeat2,
  generic: Activity,
};

/** Alternate suggested icons — parent may override via activityTypeIcon */
export const presentationSuggestedIcons: Partial<Record<ActivityPresentationType, LucideIcon[]>> = {
  event: [CalendarDays, Activity],
  appointment: [CalendarClock, Activity],
  journey: [Route, BriefcaseBusiness],
  package: [TicketCheck, Layers],
  project: [FolderKanban, Camera, ClipboardList],
  recurring: [Repeat2],
};

export function formatActivityAmount(
  amount: number | string,
  currency = '₪',
): string {
  if (typeof amount === 'number') {
    return `${currency}${amount.toLocaleString('he-IL')}`;
  }
  return amount;
}

export function hasProgressData(
  progressPercent?: number | null,
  progressLabel?: string | null,
  progressDetail?: string | null,
): boolean {
  return (
    (progressDetail != null && progressDetail.length > 0)
    || (progressLabel != null && progressLabel.length > 0)
    || (progressPercent != null && !Number.isNaN(progressPercent))
  );
}

export interface ActivityCardLayoutContext {
  id: string;
  title: string;
  variant: ActivityCardVariant;
  presentationType: ActivityPresentationType;
  activityTypeLabel?: string | null;
  activityTypeIcon?: LucideIcon | null;
  clientName?: string | null;
  dateLabel?: string | null;
  timeLabel?: string | null;
  locationLabel?: string | null;
  amount?: number | string | null;
  currency: string;
  status?: ActivityStatus | null;
  stage?: string | null;
  paymentStatus?: ActivityPaymentStatus | null;
  progressPercent?: number | null;
  progressLabel?: string | null;
  tags?: string[] | null;
  statusLabel?: string;
  paymentStatusLabel?: string;
  contextualLabel?: string | null;
  nextActionLabel?: string | null;
  usageLabel?: string | null;
  deadlineLabel?: string | null;
  recurrenceLabel?: string | null;
  nextOccurrenceLabel?: string | null;
  progressDetail?: string | null;
  isCompact: boolean;
  isHero: boolean;
  isTimeline: boolean;
  TypeIcon: LucideIcon;
  showProgress: boolean;
  showTags: boolean;
  showFinancial: boolean;
  showLocation: boolean;
}
