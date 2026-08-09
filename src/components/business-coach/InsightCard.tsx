import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BusinessInsight } from '../../business-coach/types';
import { INSIGHT_ICON_MAP } from './insightIcons';

interface InsightCardProps {
  insight: BusinessInsight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const Icon = INSIGHT_ICON_MAP[insight.icon];

  return (
    <article
      className={`bc-insight bc-insight--${insight.type} bc-insight--priority-${insight.priority}`}
    >
      <span className="bc-insight__icon" aria-hidden>
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <div className="bc-insight__body">
        <h3 className="bc-insight__title">{insight.title}</h3>
        <p className="bc-insight__description">{insight.description}</p>
        {insight.actionLabel && insight.actionTarget ? (
          <Link to={insight.actionTarget} className="bc-insight__action">
            {insight.actionLabel}
            <ChevronLeft size={16} strokeWidth={2} aria-hidden />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
