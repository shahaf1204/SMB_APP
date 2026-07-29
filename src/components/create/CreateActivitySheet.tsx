import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarClock,
  FolderKanban,
  Layers,
  Package,
  Repeat,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { EnabledCreationModel } from '../../lib/workspace/creationModels';
import type { OperatingModel } from '../../types/workspace';
import './create-activity-sheet.css';

const MODEL_ICONS: Record<OperatingModel, LucideIcon> = {
  event: Calendar,
  appointment: CalendarClock,
  journey: Layers,
  package: Package,
  recurring: Repeat,
  project: FolderKanban,
  hybrid: FolderKanban,
};

interface CreateActivitySheetProps {
  open: boolean;
  onClose: () => void;
  models: EnabledCreationModel[];
  onSelect: (model: EnabledCreationModel) => void;
}

export function CreateActivitySheet({
  open,
  onClose,
  models,
  onSelect,
}: CreateActivitySheetProps) {
  return (
    <Modal open={open} onClose={onClose} title="מה תרצי ליצור?">
      <div className="create-model-list">
        {models.map((model) => {
          const Icon = MODEL_ICONS[model.id] ?? FolderKanban;
          return (
            <button
              key={model.id}
              type="button"
              className="create-model-card"
              onClick={() => onSelect(model)}
            >
              <span className="create-model-card__icon" aria-hidden>
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <span className="create-model-card__text">
                <span className="create-model-card__label">{model.label}</span>
                {model.isPrimary && (
                  <span className="create-model-card__badge">ברירת המחדל שלך</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <Link
        to="/settings/operating-model"
        className="create-model-settings-link"
        onClick={onClose}
      >
        הוספת צורת עבודה נוספת
      </Link>
    </Modal>
  );
}
