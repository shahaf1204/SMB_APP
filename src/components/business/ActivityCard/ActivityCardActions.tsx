import type { LucideIcon } from 'lucide-react';
import { ExternalLink, FileText, MapPin, Pencil, Phone } from 'lucide-react';
import type { ActivityQuickAction, ActivityQuickActionType } from './types';

const QUICK_ACTION_ICONS: Record<ActivityQuickActionType, LucideIcon> = {
  call: Phone,
  navigate: MapPin,
  edit: Pencil,
  invoice: FileText,
  open: ExternalLink,
};

export function QuickActions({ actions }: { actions: ActivityQuickAction[] }) {
  if (!actions.length) return null;

  return (
    <div className="activity-card__actions" role="group" aria-label="פעולות מהירות">
      {actions.map((action) => {
        const ActionIcon = QUICK_ACTION_ICONS[action.type];
        return (
          <button
            key={`${action.type}-${action.label}`}
            type="button"
            className="activity-card__action"
            aria-label={action.label}
            title={action.label}
            onClick={(event) => {
              event.stopPropagation();
              action.onClick();
            }}
          >
            <ActionIcon size={18} strokeWidth={1.65} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
