import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Lead } from '../../types/models';
import type { Business } from '../../types/models';
import { buildLeadConversionDraft, mergeConversionDraft } from '../../lib/crm/leadConversion/leadConversionDraft';
import {
  evaluateConversionCompleteness,
  missingConversionLabels,
  type ConversionFieldKey,
} from '../../lib/crm/leadConversion/leadConversionCompleteness';
import { conversionFormFieldKeys } from '../../lib/crm/leadConversion/resolveConversionRequirements';
import { isLeadAlreadyConverted, isLeadConversionEligible } from '../../lib/crm/leadConversion/leadConversionEligibility';
import { resolveLeadActivityHref } from '../../lib/crm/leadConversion/leadConversionHref';
import { resolveLeadConversionTarget } from '../../lib/crm/leadConversion/leadConversionTarget';
import type { LeadConversionTargetModel } from '../../lib/crm/leadConversion/types';
import { getEnabledCreationModels } from '../../lib/workspace/creationModels';
import { useAppStore } from '../../store/useAppStore';

const TARGET_LABELS: Record<LeadConversionTargetModel, string> = {
  event: 'אירוע',
  appointment: 'פגישה',
  package: 'כרטיסייה / חבילה',
  journey: 'תהליך ליווי',
  project: 'פרויקט',
  recurring: 'חוג / פעילות קבועה',
};

const FIELD_LABEL_FALLBACK: Record<ConversionFieldKey, string> = {
  client_name: 'שם לקוח/ה',
  title: 'שם הפעילות / הבקשה',
  activity_date: 'תאריך',
  activity_time: 'שעה',
  location: 'מיקום',
  start_date: 'תאריך התחלה',
};

interface LeadConversionPanelProps {
  lead: Lead;
  business: Business;
}

export function LeadConversionPanel({ lead, business }: LeadConversionPanelProps) {
  const convertApprovedLead = useAppStore((s) => s.convertApprovedLead);
  const categories = useAppStore((s) => s.categories);
  const resolution = useMemo(() => resolveLeadConversionTarget(lead, business), [lead, business]);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<LeadConversionTargetModel>(resolution.recommendedTarget);
  const [draft, setDraft] = useState(() => buildLeadConversionDraft(lead));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mergedDraft = useMemo(() => mergeConversionDraft(buildLeadConversionDraft(lead), draft), [lead, draft]);
  const completeness = useMemo(
    () =>
      evaluateConversionCompleteness(mergedDraft, target, {
        business,
        categories,
      }),
    [mergedDraft, target, business, categories],
  );
  const missing = missingConversionLabels(completeness);
  const formFields = useMemo(
    () => conversionFormFieldKeys(completeness.requirements),
    [completeness.requirements],
  );
  const labelFor = (key: ConversionFieldKey) =>
    completeness.requirements.find((r) => r.fieldKey === key)?.labelHe ?? FIELD_LABEL_FALLBACK[key];

  if (isLeadAlreadyConverted(lead)) {
    const href = resolveLeadActivityHref(lead);
    return (
      <section className="card lead-conversion-panel" aria-live="polite">
        <p className="lead-conversion-panel__success">נוסף לפעילות ✓</p>
        {href && (
          <Link to={href} className="btn btn-primary btn-sm">
            פתיחת הפעילות
          </Link>
        )}
      </section>
    );
  }

  if (!isLeadConversionEligible(lead)) return null;

  const models = getEnabledCreationModels(business);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (busy || !completeness.readyToConfirm) return;
    setBusy(true);
    setError(null);
    const result = convertApprovedLead({ leadId: lead.id, target, draft: mergedDraft });
    setBusy(false);
    if (!result.ok) {
      setError(result.errorMessage ?? 'ההמרה נכשלה');
      return;
    }
    setOpen(false);
  };

  const showField = (key: ConversionFieldKey) => formFields.includes(key);

  return (
    <section className="card lead-conversion-panel">
      <h2 className="crm-section-title">הוספה לפעילות</h2>
      <p className="crm-meta-desc">
        הליד אושר. אפשר להשלים פרטים ולהוסיף אותו כפעילות במערכת — בלי למלא הכל מחדש.
      </p>

      {!open ? (
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          הוספה לפעילות
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="lead-conversion-form">
          {(resolution.requiresOwnerChoice || resolution.availableTargets.length > 1) && (
            <div className="field">
              <label htmlFor="conversion-target">סוג פעילות</label>
              <select
                id="conversion-target"
                value={target}
                onChange={(e) => setTarget(e.target.value as LeadConversionTargetModel)}
                disabled={busy}
              >
                {resolution.availableTargets.map((t) => (
                  <option key={t} value={t}>
                    {TARGET_LABELS[t]}
                    {t === resolution.recommendedTarget ? ' (מומלץ)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showField('client_name') && (
            <div className="field">
              <label htmlFor="conv-name">{labelFor('client_name')}</label>
              <input
                id="conv-name"
                value={mergedDraft.clientName}
                onChange={(e) => setDraft((d) => ({ ...d, clientName: e.target.value }))}
                disabled={busy}
              />
            </div>
          )}
          {showField('title') && (
            <div className="field">
              <label htmlFor="conv-title">{labelFor('title')}</label>
              <input
                id="conv-title"
                value={mergedDraft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                disabled={busy}
              />
            </div>
          )}
          {(showField('activity_date') || showField('start_date')) && (
            <div className="field">
              <label htmlFor="conv-date">
                {showField('start_date') ? labelFor('start_date') : labelFor('activity_date')}
              </label>
              <input
                id="conv-date"
                type="date"
                value={mergedDraft.activityDate ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, activityDate: e.target.value }))}
                disabled={busy}
              />
            </div>
          )}
          {showField('activity_time') && (
            <div className="field">
              <label htmlFor="conv-time">{labelFor('activity_time')}</label>
              <input
                id="conv-time"
                value={mergedDraft.activityTime ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, activityTime: e.target.value }))}
                disabled={busy}
                placeholder="לדוגמה 18:00"
              />
            </div>
          )}
          {showField('location') && (
            <div className="field">
              <label htmlFor="conv-loc">{labelFor('location')}</label>
              <input
                id="conv-loc"
                value={mergedDraft.location ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                disabled={busy}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="conv-phone">טלפון</label>
            <input
              id="conv-phone"
              value={mergedDraft.clientPhone ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, clientPhone: e.target.value }))}
              disabled={busy}
            />
          </div>

          {missing.length > 0 && (
            <div className="lead-conversion-panel__missing" role="status">
              <p className="lead-conversion-panel__missing-title">
                נשארו כמה פרטים לפני שנוכל להוסיף את הפעילות
              </p>
              <ul>
                {missing.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p className="crm-meta-error" role="alert">
              {error}
            </p>
          )}

          <div className="lead-conversion-panel__actions">
            <button type="submit" className="btn btn-primary" disabled={busy || !completeness.readyToConfirm}>
              {busy ? 'יוצרים…' : 'אישור ויצירת פעילות'}
            </button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setOpen(false)}>
              ביטול
            </button>
          </div>
          {models.length === 0 && (
            <p className="field-hint">לא הוגדרו מודלים פעילים — עדכני את הגדרות העסק.</p>
          )}
        </form>
      )}
    </section>
  );
}
