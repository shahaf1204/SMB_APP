import type { LucideIcon } from 'lucide-react';
import { cn } from '../../design-system/cn';

export function OperatingModelCard({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'work-model-option work-model-option-multi operating-model-card',
        selected && 'active',
      )}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="work-model-option-check" aria-hidden>
        {selected ? '✓' : ''}
      </span>
      <span className="operating-model-card__icon" aria-hidden>
        <Icon size={22} strokeWidth={1.65} />
      </span>
      <span className="work-model-option-text">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
    </button>
  );
}
