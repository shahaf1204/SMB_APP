import type { ActivityCardProps, ActivityCardVariant } from '../../components/business/ActivityCard';
import { ENGAGEMENT_KIND_LABEL } from '../engagements';
import { getOperatingModelDefinition } from '../../config/operatingModelConfig';
import { formatDate } from '../finance';
import type { ActivityRecord } from './types';
import type { NavigateFunction } from 'react-router-dom';

function presentationTypeLabel(type: ActivityRecord['presentationType']): string {
  if (type === 'generic') return 'פעילות';
  try {
    const def = getOperatingModelDefinition(type);
    return def.defaultTerminology.activitySingular;
  } catch {
    return 'פעילות';
  }
}

/** Map unified ActivityRecord → ActivityCard props (single page adapter). */
export function mapActivityRecordToCard(
  record: ActivityRecord,
  variant: ActivityCardVariant,
  navigate: NavigateFunction,
): ActivityCardProps {
  const onOpen = () => navigate(record.href);

  const quickActions = [];

  if (record.phone?.trim()) {
    quickActions.push({
      type: 'call' as const,
      label: 'התקשרות',
      onClick: () => {
        window.location.href = `tel:${record.phone!.trim()}`;
      },
    });
  }

  if (record.location?.trim()) {
    quickActions.push({
      type: 'navigate' as const,
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

  quickActions.push({
    type: 'edit' as const,
    label: record.source === 'event' ? 'עריכה' : 'פתיחה',
    onClick: onOpen,
  });

  const typeLabel =
    record.engagementKind != null
      ? ENGAGEMENT_KIND_LABEL[record.engagementKind]
      : presentationTypeLabel(record.presentationType);

  return {
    id: record.id,
    title: record.title,
    variant,
    presentationType: record.presentationType,
    activityTypeLabel: typeLabel,
    clientName: record.clientName,
    dateLabel: record.sortDate ? formatDate(record.sortDate) : undefined,
    locationLabel: record.location,
    amount: record.amount,
    status: record.status,
    stage: record.stage,
    paymentStatus: record.paymentStatus ?? undefined,
    progressPercent: record.progressPercent,
    progressLabel: record.usageLabel,
    progressDetail: record.progressDetail,
    tags: record.tags.length ? record.tags : undefined,
    contextualLabel: record.contextualLabel,
    nextActionLabel: record.nextOccurrenceLabel,
    usageLabel: record.usageLabel,
    deadlineLabel: record.deadlineLabel,
    recurrenceLabel: record.recurrenceLabel,
    nextOccurrenceLabel: record.nextOccurrenceLabel,
    onClick: onOpen,
    quickActions: quickActions.slice(0, 3),
  };
}
