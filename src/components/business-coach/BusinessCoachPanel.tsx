import { limitInsights } from '../../business-coach/priority';
import type { BusinessInsight } from '../../business-coach/types';
import { InsightCard } from './InsightCard';

interface BusinessCoachPanelProps {
  insights: BusinessInsight[];
  /** Maximum insights shown — default 3 */
  maxInsights?: number;
}

export function BusinessCoachPanel({
  insights,
  maxInsights = 3,
}: BusinessCoachPanelProps) {
  const visible = limitInsights(insights, maxInsights);

  if (visible.length === 0) return null;

  return (
    <section
      className="dash-v2-section dash-v2-section--tight bc-panel"
      aria-label="המלצות עסקיות"
    >
      <div className="bc-panel__head">
        <h2 className="bc-panel__title">מה דורש את תשומת הלב שלך</h2>
        <p className="bc-panel__subtitle">המלצות ועדכונים לפי מה שקורה בעסק</p>
      </div>
      <div className="bc-panel__list">
        {visible.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </section>
  );
}
