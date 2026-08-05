import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Text } from '../ds/Text';

interface ActivitiesSectionProps {
  title: string;
  count?: number;
  context?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: ReactNode;
}

export function ActivitiesSection({
  title,
  count,
  context,
  collapsible = false,
  defaultCollapsed = false,
  children,
}: ActivitiesSectionProps) {
  const [open, setOpen] = useState(!defaultCollapsed);

  if (collapsible) {
    return (
      <section className="activities-section activities-section--collapsible">
        <button
          type="button"
          className="activities-section__header activities-section__header--toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <ActivitiesSectionHeading title={title} count={count} context={context} />
          <ChevronDown
            size={18}
            className={`activities-section__chevron ${open ? 'open' : ''}`}
            aria-hidden
          />
        </button>
        {open && <div className="activities-section__body">{children}</div>}
      </section>
    );
  }

  return (
    <section className="activities-section">
      <div className="activities-section__header">
        <ActivitiesSectionHeading title={title} count={count} context={context} />
      </div>
      <div className="activities-section__body">{children}</div>
    </section>
  );
}

function ActivitiesSectionHeading({
  title,
  count,
  context,
}: Pick<ActivitiesSectionProps, 'title' | 'count' | 'context'>) {
  return (
    <div className="activities-section__heading">
      <Text variant="h3" as="h2" className="activities-section__title">
        {title}
        {count != null && count > 0 && (
          <span className="activities-section__count">{count}</span>
        )}
      </Text>
      {context && (
        <Text variant="small" tone="muted" className="activities-section__context">
          {context}
        </Text>
      )}
    </div>
  );
}
