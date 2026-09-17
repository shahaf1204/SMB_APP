import type { Lead } from '../../types/models';
import { LEAD_INTAKE_STATUS_LABELS } from '../../lib/crm/leadIntakeLabels';
import {
  buildLeadRequestSummary,
  formatLeadSourceLabel,
  missingConversionFieldLabelsHe,
  missingReviewFieldLabelsHe,
} from '../../lib/crm/leadReviewPresentation';
import { isUnresolvedIntakeLead, participatesInIntakeWorkflow } from '../../lib/crm/leadIntake';
import { formatDate } from '../../lib/finance';
import { LeadContactActions } from '../LeadContactActions';

interface LeadIntakeReviewPanelProps {
  lead: Lead;
  busy?: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export function LeadIntakeReviewPanel({
  lead,
  busy,
  onApprove,
  onReject,
}: LeadIntakeReviewPanelProps) {
  if (!participatesInIntakeWorkflow(lead)) return null;

  const unresolved = isUnresolvedIntakeLead(lead);
  const requestRows = buildLeadRequestSummary(lead);
  const missingReview = missingReviewFieldLabelsHe(lead);
  const missingConversion = missingConversionFieldLabelsHe(lead);
  const ready = lead.completenessSnapshot?.readyForReview ?? false;
  const intakeLabel = lead.intakeStatus
    ? LEAD_INTAKE_STATUS_LABELS[lead.intakeStatus]
    : '';

  return (
    <section className="card lead-intake-review" aria-labelledby="lead-intake-review-title">
      <h2 className="crm-section-title" id="lead-intake-review-title">
        בדיקת ליד נכנס
      </h2>
      <p className="lead-intake-review__status">
        סטטוס קליטה: <strong>{intakeLabel}</strong>
      </p>

      <div className="lead-intake-review__grid">
        <div>
          <h3 className="lead-intake-review__subtitle">לקוח/ה</h3>
          <p>{lead.name}</p>
          {lead.phone && <p>📞 {lead.phone}</p>}
          {lead.email && <p>✉️ {lead.email}</p>}
          <LeadContactActions name={lead.name} phone={lead.phone} email={lead.email} />
        </div>
        <div>
          <h3 className="lead-intake-review__subtitle">מקור</h3>
          <p>{formatLeadSourceLabel(lead)}</p>
          <p className="crm-lead-date">
            התקבל: {formatDate(lead.createdAt.slice(0, 10))}
          </p>
        </div>
      </div>

      {requestRows.length > 0 && (
        <div className="lead-intake-review__block">
          <h3 className="lead-intake-review__subtitle">פרטי הבקשה</h3>
          <ul className="crm-form-answers">
            {requestRows.map((row, i) => (
              <li key={i}>
                <strong>{row.label}:</strong> {row.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="lead-intake-review__block">
        <h3 className="lead-intake-review__subtitle">שלמות מידע</h3>
        {ready ? (
          <p className="lead-intake-review__ready">מוכן לבדיקה — יש מספיק פרטים להבין את הפנייה ולטפל בה.</p>
        ) : (
          <>
            <p className="lead-intake-review__missing-title">חסרים כמה פרטים כדי להתקדם</p>
            {missingReview.length > 0 ? (
              <ul className="lead-intake-review__missing-list">
                {missingReview.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            ) : (
              <p className="field-hint">חסרים פרטים נדרשים — עדכני את הליד או המתיני להשלמה מהלקוח (בקרוב).</p>
            )}
          </>
        )}
        {missingConversion.length > 0 && (
          <div className="lead-intake-review__conversion-gap">
            <p className="lead-intake-review__subtitle">לפני המרה לפעילות (שלב הבא)</p>
            <p className="field-hint">עדיין חסר: {missingConversion.join(' · ')}</p>
          </div>
        )}
        <button type="button" className="btn btn-ghost btn-sm lead-intake-review__future" disabled title="יופעל בשלב 3A.7">
          בקשי השלמת פרטים (בקרוב)
        </button>
      </div>

      {unresolved && (
        <div className="lead-intake-review__actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !ready}
            onClick={onApprove}
          >
            אישור הליד
          </button>
          <button type="button" className="btn btn-ghost lead-intake-review__reject" disabled={busy} onClick={onReject}>
            דחיית הליד
          </button>
          {!ready && (
            <p className="field-hint" role="note">
              לא ניתן לאשר ליד שחסרים בו פרטים חשובים. אפשר לדחות או להשלים פרטים.
            </p>
          )}
        </div>
      )}

      {lead.intakeStatus === 'approved' && (
        <p className="lead-intake-review__approved" role="status">
          הליד אושר לבדיקה — המרה לפעילות תתאפשר בשלב הבא.
        </p>
      )}
      {lead.intakeStatus === 'rejected' && (
        <p className="lead-intake-review__rejected" role="status">
          הליד נדחה ולא דורש עוד טיפול בקליטה.
        </p>
      )}
    </section>
  );
}
