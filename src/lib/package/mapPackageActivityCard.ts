import type { ActivityCardProps, ActivityQuickAction } from '../../components/business/ActivityCard';
import { ENGAGEMENT_KIND_LABEL, packProgress } from '../engagements';
import { formatDate } from '../finance';
import { engagementRevenueAmount } from '../finance/engagementFinancialSync';
import { getEventRevenueTotal } from '../events';
import type {
  Engagement,
  EventValue,
  Invoice,
  Milestone,
} from '../../types/models';
import { isInvoiceOverdue } from '../invoices';
import type { NavigateFunction } from 'react-router-dom';
import {
  hasPackPaymentOverdue,
  isPackExpiringSoon,
  isPackLowRemaining,
  packNeedsAttention,
} from './packageDashboardStats';
import type { ResolvedPackageDashboardConfig } from './resolvePackageDashboardConfig';
import { logSessionRoute } from './resolvePackageDashboardConfig';

function resolvePaymentStatus(
  engagementId: string,
  invoices: Invoice[],
): ActivityCardProps['paymentStatus'] {
  const linked = invoices.filter((inv) => inv.engagementId === engagementId);
  if (!linked.length) return undefined;
  if (linked.some(isInvoiceOverdue)) return 'overdue';
  if (linked.every((i) => i.status === 'paid')) return 'paid';
  if (linked.some((i) => i.status === 'paid')) return 'partial';
  return 'unpaid';
}

function buildPackageQuickActions(
  engagement: Engagement,
  navigate: NavigateFunction,
): ActivityQuickAction[] {
  const actions: ActivityQuickAction[] = [];
  const { remaining } = packProgress(engagement);

  if (engagement.status === 'active' && remaining > 0) {
    actions.push({
      type: 'open',
      label: 'רישום מפגש',
      onClick: () => navigate(logSessionRoute(engagement.id)),
    });
  }

  actions.push({
    type: 'edit',
    label: 'פתיחה',
    onClick: () => navigate(`/engagements/${engagement.id}`),
  });

  const phone = engagement.clientPhone?.trim();
  if (phone) {
    actions.push({
      type: 'call',
      label: 'התקשרות',
      onClick: () => {
        window.location.href = `tel:${phone}`;
      },
    });
  }

  return actions.slice(0, 3);
}

/** Map a session_pack engagement to ActivityCard props for package workspace UI. */
export function mapPackageEngagementToActivityCard(
  engagement: Engagement,
  params: {
    navigate: NavigateFunction;
    eventValues: EventValue[];
    milestones: Milestone[];
    invoices: Invoice[];
    config: ResolvedPackageDashboardConfig;
    todayIso: string;
    variant?: ActivityCardProps['variant'];
  },
): ActivityCardProps {
  const { used, total, remaining } = packProgress(engagement);
  const relatedMs = params.milestones.filter((m) => m.engagementId === engagement.id);
  const amount =
    (engagement.eventId
      ? getEventRevenueTotal(engagement.eventId, params.eventValues)
      : 0) || engagementRevenueAmount(engagement, relatedMs);

  const usageLabel = total > 0 ? `נותרו ${remaining} מתוך ${total}` : undefined;
  const progressDetail = total > 0 ? `${used} מתוך ${total} נוצלו` : undefined;
  const progressPercent = total > 0 ? Math.round((used / total) * 100) : undefined;

  let deadlineLabel: string | undefined;
  if (engagement.packExpiresAt) {
    deadlineLabel = `תוקף ${formatDate(engagement.packExpiresAt)}`;
  }

  const attention = packNeedsAttention(
    engagement,
    params.config,
    params.invoices,
    params.todayIso,
  );

  let status: ActivityCardProps['status'] =
    engagement.status === 'completed' ? 'completed' : 'active';
  if (attention && engagement.status === 'active') {
    status = 'needs_attention';
  }

  let contextualLabel: string | undefined;
  if (isPackLowRemaining(engagement, params.config.lowSessionsThreshold)) {
    contextualLabel = `נותרו ${remaining} מפגשים`;
  } else if (
    isPackExpiringSoon(engagement, params.todayIso, params.config.expiringDaysThreshold)
  ) {
    contextualLabel = deadlineLabel ?? 'תוקף מתקרב';
  } else if (hasPackPaymentOverdue(engagement.id, params.invoices)) {
    contextualLabel = 'תשלום באיחור';
  }

  return {
    id: `eng-${engagement.id}`,
    title: engagement.title,
    variant: params.variant ?? 'standard',
    presentationType: 'package',
    activityTypeLabel: ENGAGEMENT_KIND_LABEL.session_pack,
    clientName: engagement.clientName || engagement.title,
    dateLabel: engagement.packExpiresAt ? formatDate(engagement.packExpiresAt) : undefined,
    amount: amount > 0 ? amount : undefined,
    status,
    paymentStatus: resolvePaymentStatus(engagement.id, params.invoices),
    progressPercent,
    progressLabel: usageLabel,
    progressDetail,
    usageLabel,
    deadlineLabel,
    contextualLabel,
    onClick: () => params.navigate(`/engagements/${engagement.id}`),
    quickActions: buildPackageQuickActions(engagement, params.navigate),
  };
}
