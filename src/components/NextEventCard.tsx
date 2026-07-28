import { Calendar, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ActivityCard } from './business/ActivityCard';
import {
  DASHBOARD_FEATURED_SECTION_HE,
  OPERATING_MODEL_CREATE_ROUTE,
  QUICK_ACTION_LABELS_HE,
} from '../config/operatingModelConfig';
import { mapEventToActivityCard } from '../lib/activityCard/mapEventToActivityCard';
import { resolveWorkspaceConfig } from '../lib/workspace';
import type { Business, Event, Invoice } from '../types/models';
import type { OperatingModel } from '../types/workspace';

export interface NextEventCardProps {
  event: Event | null;
  clientName: string | null;
  amount: number;
  business: Business | null;
  invoices?: Invoice[];
}

function emptyStateCopy(primaryModel: OperatingModel) {
  const createRoute = OPERATING_MODEL_CREATE_ROUTE[primaryModel];
  const quickKey =
    primaryModel === 'hybrid'
      ? 'new_activity'
      : primaryModel === 'appointment'
        ? 'new_appointment'
        : primaryModel === 'event'
          ? 'new_event'
          : primaryModel === 'journey'
            ? 'new_journey'
            : primaryModel === 'package'
              ? 'new_package'
              : primaryModel === 'recurring'
                ? 'new_recurring'
                : 'new_project';

  return {
    createRoute,
    ctaLabel: QUICK_ACTION_LABELS_HE[quickKey] ?? 'יצירת פעילות',
  };
}

/**
 * Dashboard featured next-activity section — uses approved ActivityCard v3.
 * Replaces the legacy dash-v2-next-event inline card.
 */
export function NextEventCard({
  event,
  clientName,
  amount,
  business,
  invoices = [],
}: NextEventCardProps) {
  const navigate = useNavigate();
  const workspace = resolveWorkspaceConfig(business);
  const primaryModel = workspace?.workspace.primaryOperatingModel ?? 'event';
  const sectionLabel = DASHBOARD_FEATURED_SECTION_HE[primaryModel];
  const { createRoute, ctaLabel } = emptyStateCopy(primaryModel);

  if (!event) {
    return (
      <section
        className="dash-v2-section dash-v2-section--tight dash-v2-featured-activity"
        aria-label={sectionLabel}
      >
        <div className="dash-v2-section-head dash-v2-section-head--compact">
          <h2 className="dash-v2-section-title">{sectionLabel}</h2>
        </div>
        <div className="dash-v2-next-event-empty">
          <span className="dash-v2-next-event-empty-icon" aria-hidden>
            <Calendar size={24} strokeWidth={1.5} />
          </span>
          <h3 className="dash-v2-next-event-empty-title">אין פעילות קרובה</h3>
          <p className="dash-v2-next-event-empty-msg">
            כשתוסיפי פעילות חדשה, היא תופיע כאן.
          </p>
          <Link to={createRoute} className="ds-btn ds-btn--primary ds-btn--sm">
            <Plus size={16} strokeWidth={2} aria-hidden />
            {ctaLabel}
          </Link>
        </div>
      </section>
    );
  }

  const cardProps = mapEventToActivityCard({
    event,
    clientName,
    amount,
    business,
    invoices,
    onEdit: () => navigate(`/events/${event.id}/edit`),
    onInvoice: () =>
      navigate('/invoices/new', {
        state: { fromEventId: event.id },
      }),
  });

  return (
    <section
      className="dash-v2-section dash-v2-section--featured dash-v2-featured-activity"
      aria-label={sectionLabel}
    >
      <div className="dash-v2-section-head dash-v2-section-head--compact">
        <h2 className="dash-v2-section-title">{sectionLabel}</h2>
      </div>
      <ActivityCard {...cardProps} className="dash-v2-featured-activity__card" />
    </section>
  );
}
