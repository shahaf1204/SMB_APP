import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { ONBOARDING_MODEL_CONTENT } from '../../config/onboardingModelContent';
import { cn } from '../../design-system/cn';
import type { OperatingModel } from '../../types/workspace';

export function OperatingModelSelectCard({
  modelId,
  icon: Icon,
  title,
  description,
  examplesHe,
  selected,
  locked,
  onSelect,
  expandable = true,
}: {
  modelId: OperatingModel;
  icon: LucideIcon;
  title: string;
  description: string;
  examplesHe?: string;
  selected: boolean;
  locked?: boolean;
  onSelect: () => void;
  expandable?: boolean;
}) {
  const content = ONBOARDING_MODEL_CONTENT[modelId];
  const examples = examplesHe ?? content.examplesHe;

  return (
    <button
      type="button"
      className={cn(
        'onboarding-model-card',
        selected && 'onboarding-model-card--selected',
        locked && 'onboarding-model-card--locked',
      )}
      onClick={locked ? undefined : onSelect}
      aria-pressed={selected}
      disabled={locked}
    >
      <span className="onboarding-model-card__check" aria-hidden>
        {selected ? '✓' : ''}
      </span>
      <span className={`onboarding-model-card__icon onboarding-model-card__icon--${modelId}`} aria-hidden>
        <Icon size={22} strokeWidth={1.65} />
      </span>
      <span className="onboarding-model-card__body">
        <strong className="onboarding-model-card__title">{title}</strong>
        <span className="onboarding-model-card__desc">{description}</span>
        {examples && (
          <span className="onboarding-model-card__examples">לדוגמה: {examples}</span>
        )}
        {selected && expandable && (
          <span className="onboarding-model-card__expand">
            <span className="onboarding-model-card__preview-grid">
              <span><em>דשבורד:</em> {content.preview.dashboard}</span>
              <span><em>תצוגה:</em> {content.preview.view}</span>
              <span><em>כפתור ראשי:</em> {content.preview.primaryAction}</span>
              <span><em>מעקב:</em> {content.preview.tracking}</span>
            </span>
            <span className="onboarding-model-card__expansion-list">
              {content.expansionItems.map((item) => (
                <span key={item} className="onboarding-model-card__expansion-item">
                  {item}
                </span>
              ))}
            </span>
            <ChevronDown size={16} className="onboarding-model-card__chevron" aria-hidden />
          </span>
        )}
      </span>
    </button>
  );
}
