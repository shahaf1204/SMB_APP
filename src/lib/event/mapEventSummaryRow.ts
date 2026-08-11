import type { NavigateFunction } from 'react-router-dom';
import {
  activityStatusLabels,
  paymentStatusLabels,
  type ActivityQuickAction,
} from '../../components/business/ActivityCard';
import type { ActivityRecord } from '../activities/types';

/** Build up to 3 real quick actions for an event summary row expanded state. */
export function buildEventSummaryQuickActions(
  record: ActivityRecord,
  navigate: NavigateFunction,
): ActivityQuickAction[] {
  const actions: ActivityQuickAction[] = [];

  actions.push({
    type: 'edit',
    label: 'עריכה',
    onClick: () => navigate(record.href),
  });

  if (record.phone?.trim()) {
    actions.push({
      type: 'call',
      label: 'התקשרות',
      onClick: () => {
        window.location.href = `tel:${record.phone!.trim()}`;
      },
    });
  }

  if (record.location?.trim()) {
    actions.push({
      type: 'navigate',
      label: 'ניווט',
      onClick: () => {
        window.open(
          `https://maps.google.com/?q=${encodeURIComponent(record.location!)}`,
          '_blank',
          'noopener,noreferrer',
        );
      },
    });
  }

  if (record.source === 'event' && record.paymentStatus !== 'paid') {
    actions.push({
      type: 'invoice',
      label: 'חשבונית',
      onClick: () =>
        navigate('/invoices/new', {
          state: { fromEventId: record.sourceId },
        }),
    });
  }

  return actions.slice(0, 3);
}

export function resolveEventRowStatusLabel(record: ActivityRecord): string {
  if (record.needsAttention || record.status === 'needs_attention') {
    return activityStatusLabels.needs_attention;
  }
  if (record.paymentStatus === 'overdue') {
    return paymentStatusLabels.overdue;
  }
  return activityStatusLabels[record.status] ?? activityStatusLabels.active;
}

export function resolveEventRowStatusTone(
  record: ActivityRecord,
): 'default' | 'attention' | 'completed' | 'cancelled' {
  if (record.needsAttention || record.status === 'needs_attention') return 'attention';
  if (record.status === 'completed') return 'completed';
  if (record.status === 'cancelled') return 'cancelled';
  return 'default';
}
