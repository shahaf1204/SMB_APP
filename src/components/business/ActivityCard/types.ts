import type { LucideIcon } from 'lucide-react';

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
): boolean {
  return (
    progressLabel != null && progressLabel.length > 0
  ) || (
    progressPercent != null && !Number.isNaN(progressPercent)
  );
}
