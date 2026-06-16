import { resolvePrimaryWorkModel, PRIMARY_WORK_MODEL_LABEL, PRIMARY_WORK_MODEL_OPTIONS } from '../lib/workModel';
import { useAppStore } from '../store/useAppStore';
import type { PrimaryWorkModel } from '../types/models';

export function WorkModelSettings() {
  const business = useAppStore((s) => s.business)!;
  const updatePrimaryWorkModel = useAppStore((s) => s.updatePrimaryWorkModel);
  const current = resolvePrimaryWorkModel(business);

  const handleChange = (model: PrimaryWorkModel) => {
    updatePrimaryWorkModel(model);
  };

  return (
    <section className="card" style={{ marginTop: '1rem' }}>
      <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>סוג עבודה עיקרי</h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 0.75rem' }}>
        משפיע על הדשבורד ועל «➕ חדש». נוכחי: {PRIMARY_WORK_MODEL_LABEL[current]}
      </p>
      <div className="work-model-grid work-model-grid-compact">
        {PRIMARY_WORK_MODEL_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`work-model-option ${current === opt.id ? 'active' : ''}`}
            onClick={() => handleChange(opt.id)}
          >
            <span className="work-model-option-icon" aria-hidden>
              {opt.icon}
            </span>
            <span className="work-model-option-text">
              <strong>{opt.title}</strong>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
