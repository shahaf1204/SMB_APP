import type {
  ActivityCardProps,
  ActivityPaymentStatus,
  ActivityQuickAction,
} from '../../components/business/ActivityCard';
import type { Event, Invoice } from '../../types/models';
import { externalFormEventBadge } from '../externalForms/badges';
import { formatDate } from '../finance';
import { contextualDateLabel } from './contextualDateLabel';
import { resolvePresentationType } from './resolvePresentationType';
import type { Business } from '../../types/models';

export interface MapEventToActivityCardInput {
  event: Event;
  clientName: string | null;
  amount: number;
  business: Business | null;
  invoices?: Invoice[];
  onEdit: () => void;
  onInvoice?: () => void;
}

function resolvePaymentStatus(
  eventId: string,
  invoices: Invoice[],
): ActivityPaymentStatus | null {
  const linked = invoices.filter((inv) => inv.eventId === eventId);
  if (!linked.length) return null;

  const statuses = linked
    .map((inv) => inv.paymentStatus)
    .filter((s): s is NonNullable<typeof s> => Boolean(s && s !== 'none' && s !== 'cancelled'));

  if (!statuses.length) return null;
  if (statuses.every((s) => s === 'paid')) return 'paid';
  if (statuses.some((s) => s === 'paid')) return 'partial';
  if (statuses.some((s) => s === 'pending')) return 'partial';
  return 'unpaid';
}

function buildQuickActions(
  event: Event,
  onEdit: () => void,
  onInvoice?: () => void,
): ActivityQuickAction[] {
  const actions: ActivityQuickAction[] = [
    {
      type: 'edit',
      label: 'עריכה',
      onClick: onEdit,
    },
  ];

  const phone = event.clientPhone?.trim();
  if (phone) {
    actions.push({
      type: 'call',
      label: 'התקשרות',
      onClick: () => {
        window.location.href = `tel:${phone}`;
      },
    });
  }

  const location = event.location?.trim();
  if (location) {
    actions.push({
      type: 'navigate',
      label: 'ניווט',
      onClick: () => {
        window.open(
          `https://maps.google.com/?q=${encodeURIComponent(location)}`,
          '_blank',
          'noopener,noreferrer',
        );
      },
    });
  }

  if (onInvoice) {
    actions.push({
      type: 'invoice',
      label: 'חשבונית',
      onClick: onInvoice,
    });
  }

  return actions.slice(0, 3);
}

/** Map a production Event + dashboard selectors into ActivityCard display props. */
export function mapEventToActivityCard(
  input: MapEventToActivityCardInput,
): ActivityCardProps {
  const { event, clientName, amount, business, invoices = [], onEdit, onInvoice } = input;
  const presentationType = resolvePresentationType(business);

  const contextual = contextualDateLabel(event.eventDate);
  const formBadge = externalFormEventBadge(event);
  const tags = formBadge ? [formBadge] : undefined;

  const revenue = amount > 0 ? amount : null;
  const paymentStatus = resolvePaymentStatus(event.id, invoices);

  const quickActions = buildQuickActions(event, onEdit, onInvoice);

  return {
    id: event.id,
    title: event.title,
    variant: 'hero',
    presentationType,
    clientName: clientName ?? undefined,
    dateLabel: formatDate(event.eventDate),
    locationLabel: event.location?.trim() || undefined,
    amount: revenue,
    paymentStatus,
    contextualLabel: contextual,
    tags,
    onClick: onEdit,
    quickActions: quickActions.length > 0 ? quickActions : undefined,
  };
}
