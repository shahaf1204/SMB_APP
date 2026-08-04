import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarClock,
  FolderKanban,
  Layers,
  Package,
  Repeat,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { getEnabledCreationModels } from '../lib/workspace/creationModels';
import { useAppStore } from '../store/useAppStore';
import type { OperatingModel } from '../types/workspace';

const MODEL_ICONS: Record<OperatingModel, LucideIcon> = {
  event: Calendar,
  appointment: CalendarClock,
  journey: Layers,
  package: Package,
  recurring: Repeat,
  project: FolderKanban,
  hybrid: FolderKanban,
};

export function CreateHubPage() {
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business);
  const models = useMemo(() => getEnabledCreationModels(business), [business]);

  useEffect(() => {
    if (models.length === 1) {
      navigate(models[0].route, { replace: true });
    }
  }, [models, navigate]);

  if (models.length <= 1) return null;

  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">מה תרצי ליצור?</h1>
        <p className="page-subtitle">בחרי את סוג הפעילות</p>

        <div className="create-hub-list">
          {models.map((model) => {
            const Icon = MODEL_ICONS[model.id] ?? FolderKanban;
            return (
              <Link
                key={model.id}
                to={model.route}
                state={{ operatingModel: model.id }}
                className={`card create-hub-card ${model.isPrimary ? 'create-hub-card-primary' : ''}`}
              >
                <span className="create-hub-icon-wrap" aria-hidden>
                  <Icon size={22} strokeWidth={2} />
                </span>
                <div>
                  <strong>
                    {model.label}
                    {model.isPrimary && (
                      <span className="create-hub-badge">ברירת המחדל שלך</span>
                    )}
                  </strong>
                </div>
              </Link>
            );
          })}
        </div>

        <Link to="/settings/operating-model" className="create-hub-link">
          הוספת צורת עבודה נוספת
        </Link>

        <Link to="/activities" className="create-hub-link">
          חזרה לפעילויות ←
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
