import { useState } from 'react';
import {
  getOperatingModelDefinition,
  operatingModelTitleHe,
  OPERATING_MODEL_ADDITIONAL_OPTIONS,
  OPERATING_MODEL_ONBOARDING_OPTIONS,
} from '../../config/operatingModelConfig';
import { buildWorkspaceConfig, migrateWorkspaceFromBusiness, normalizeEnabledModels } from '../../lib/workspace';
import { useAppStore } from '../../store/useAppStore';
import type { OperatingModel } from '../../types/workspace';
import { OperatingModelCard } from './OperatingModelCard';

const PRIMARY_CHANGE_WARNING =
  'השינוי ישפיע על ברירות המחדל והתצוגות, אך לא ימחק נתונים קיימים.';

export function OperatingModelSettings() {
  const business = useAppStore((s) => s.business)!;
  const updateWorkspaceConfig = useAppStore((s) => s.updateWorkspaceConfig);

  const workspace = business.workspace ?? migrateWorkspaceFromBusiness(business)!;
  const [primary, setPrimary] = useState<OperatingModel>(
    workspace.primaryOperatingModel,
  );
  const [additional, setAdditional] = useState<OperatingModel[]>(
    workspace.enabledOperatingModels.filter((m) => m !== workspace.primaryOperatingModel),
  );
  const [showWarning, setShowWarning] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleAdditional = (model: OperatingModel) => {
    if (model === primary) return;
    setAdditional((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model],
    );
    setSaved(false);
  };

  const handlePrimaryChange = (model: OperatingModel) => {
    if (model !== workspace.primaryOperatingModel) {
      setShowWarning(true);
    }
    setPrimary(model);
    if (model !== 'hybrid') {
      setAdditional((prev) => prev.filter((m) => m !== model));
    }
    setSaved(false);
  };

  const handleSave = () => {
    const enabled = normalizeEnabledModels(primary, additional);
    updateWorkspaceConfig({
      primaryOperatingModel: primary,
      enabledOperatingModels: enabled,
      terminology: getOperatingModelDefinition(primary).defaultTerminology,
    });
    setSaved(true);
    setShowWarning(false);
  };

  const additionalOptions =
    primary === 'hybrid'
      ? OPERATING_MODEL_ONBOARDING_OPTIONS.filter((o) => o.id !== 'hybrid')
      : OPERATING_MODEL_ADDITIONAL_OPTIONS.filter((o) => o.id !== primary);

  return (
    <section className="card" style={{ marginTop: '1rem' }}>
      <h2 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>צורת העבודה של העסק</h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 0.75rem' }}>
        נוכחי: {operatingModelTitleHe(workspace.primaryOperatingModel)}
      </p>

      {showWarning && (
        <p className="onboarding-suggestion" role="status">
          {PRIMARY_CHANGE_WARNING}
        </p>
      )}

      <p className="field-hint" style={{ marginBottom: '0.5rem' }}>
        צורת עבודה עיקרית
      </p>
      <div className="work-model-grid work-model-grid-compact">
        {OPERATING_MODEL_ONBOARDING_OPTIONS.map((opt) => (
          <OperatingModelCard
            key={opt.id}
            icon={opt.icon}
            title={opt.titleHe}
            description={opt.descriptionHe}
            selected={primary === opt.id}
            onSelect={() => handlePrimaryChange(opt.id)}
          />
        ))}
      </div>

      {primary !== 'hybrid' && (
        <>
          <p className="field-hint" style={{ margin: '1rem 0 0.5rem' }}>
            מודלים נוספים (אופציונלי)
          </p>
          <div className="work-model-grid work-model-grid-compact">
            {additionalOptions.map((opt) => (
              <OperatingModelCard
                key={opt.id}
                icon={opt.icon}
                title={opt.titleHe}
                description={opt.descriptionHe}
                selected={additional.includes(opt.id)}
                onSelect={() => toggleAdditional(opt.id)}
              />
            ))}
          </div>
        </>
      )}

      {primary === 'hybrid' && (
        <>
          <p className="field-hint" style={{ margin: '1rem 0 0.5rem' }}>
            בחר/י לפחות שני מודלים פעילים
          </p>
          <div className="work-model-grid work-model-grid-compact">
            {additionalOptions.map((opt) => (
              <OperatingModelCard
                key={opt.id}
                icon={opt.icon}
                title={opt.titleHe}
                description={opt.descriptionHe}
                selected={additional.includes(opt.id)}
                onSelect={() => toggleAdditional(opt.id)}
              />
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: '1rem', width: '100%' }}
        onClick={handleSave}
      >
        שמירת צורת העבודה
      </button>
      {saved && (
        <p className="field-hint" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          נשמר בהצלחה
        </p>
      )}
    </section>
  );
}

export function buildWorkspaceFromOnboarding(
  primary: OperatingModel,
  additional: OperatingModel[],
  presetId?: string,
) {
  return buildWorkspaceConfig({
    primaryOperatingModel: primary,
    enabledOperatingModels: normalizeEnabledModels(primary, additional),
    businessType: presetId,
    onboardingCompleted: true,
    terminology: getOperatingModelDefinition(primary).defaultTerminology,
  });
}
