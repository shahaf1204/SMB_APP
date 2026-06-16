import {
  resolveWorkModels,
  toggleWorkModel,
  WORK_CONCEPT_LABEL,
  WORK_CONCEPT_OPTIONS,
  workModelsLabel,
} from '../lib/workModel';
import { useAppStore } from '../store/useAppStore';
import type { WorkConcept } from '../types/models';

export function WorkModelSettings() {
  const business = useAppStore((s) => s.business)!;
  const updateWorkModels = useAppStore((s) => s.updateWorkModels);
  const current = resolveWorkModels(business);

  const handleToggle = (id: WorkConcept) => {
    updateWorkModels(toggleWorkModel(current, id));
  };

  return (
    <section className="card" style={{ marginTop: '1rem' }}>
      <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>קונסeptי העבודה</h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 0.75rem' }}>
        קובעים מה יופיע בדשבורד וב«➕ חדש». נוכחי: {workModelsLabel(current)}
      </p>
      <div className="work-model-grid work-model-grid-compact">
        {WORK_CONCEPT_OPTIONS.map((opt) => {
          const selected = current.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              className={`work-model-option work-model-option-multi ${selected ? 'active' : ''}`}
              onClick={() => handleToggle(opt.id)}
              aria-pressed={selected}
            >
              <span className="work-model-option-check" aria-hidden>
                {selected ? '✓' : ''}
              </span>
              <span className="work-model-option-icon" aria-hidden>
                {opt.icon}
              </span>
              <span className="work-model-option-text">
                <strong>{WORK_CONCEPT_LABEL[opt.id]}</strong>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
