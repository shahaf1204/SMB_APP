import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/finance';
import { logSessionRoute } from '../../lib/package/resolvePackageDashboardConfig';
import type { PackageListItem } from '../../lib/package/packageClientList';
import { isInvoiceOverdue } from '../../lib/invoices';
import type { Invoice } from '../../types/models';

interface PackageSummaryRowProps {
  item: PackageListItem;
  invoices: Invoice[];
  compact?: boolean;
  onRegisterSession?: () => void;
}

function resolvePaymentLabel(item: PackageListItem, invoices: Invoice[]): string | null {
  const linked = invoices.filter((inv) => inv.engagementId === item.engagement.id);
  if (!linked.length) return null;
  if (linked.some(isInvoiceOverdue)) return 'תשלום באיחור';
  if (linked.every((i) => i.status === 'paid')) return 'שולם';
  if (linked.some((i) => i.status === 'paid')) return 'שולם חלקית';
  return 'לא שולם';
}

/** Compact package line within a client group */
export function PackageSummaryRow({
  item,
  invoices,
  compact = false,
  onRegisterSession,
}: PackageSummaryRowProps) {
  const navigate = useNavigate();
  const paymentLabel = resolvePaymentLabel(item, invoices);
  const canRegister =
    item.engagement.status === 'active' && item.remaining > 0;

  if (compact) {
    return (
      <div className="pkg-summary-row pkg-summary-row--compact">
        <div className="pkg-summary-row__head">
          <span className="pkg-summary-row__bullet" aria-hidden>•</span>
          <span className="pkg-summary-row__title">{item.engagement.title}</span>
          {item.status !== 'active' && (
            <span className={`pkg-status-pill pkg-status-pill--${item.status}`}>
              {item.statusLabel}
            </span>
          )}
        </div>
        <span className="pkg-summary-row__usage">{item.usageLabel}</span>
        {item.progressPercent != null && (
          <div className="pkg-progress" aria-hidden>
            <div
              className="pkg-progress__fill"
              style={{ width: `${item.progressPercent}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pkg-summary-row pkg-summary-row--expanded">
      <dl className="pkg-detail-grid">
        <div>
          <dt>כרטיסייה</dt>
          <dd>{item.engagement.title}</dd>
        </div>
        {item.engagement.startDate && (
          <div>
            <dt>תאריך רכישה</dt>
            <dd>{formatDate(item.engagement.startDate)}</dd>
          </div>
        )}
        {item.engagement.packExpiresAt && (
          <div>
            <dt>תוקף</dt>
            <dd>{formatDate(item.engagement.packExpiresAt)}</dd>
          </div>
        )}
        <div>
          <dt>מפגשים</dt>
          <dd>
            {item.total > 0
              ? `${item.used} נוצלו · ${item.remaining} נותרו · ${item.total} סה״כ`
              : '—'}
          </dd>
        </div>
        {paymentLabel && (
          <div>
            <dt>תשלום</dt>
            <dd>{paymentLabel}</dd>
          </div>
        )}
        {item.engagement.packAmount != null && item.engagement.packAmount > 0 && (
          <div>
            <dt>סכום</dt>
            <dd>{formatCurrency(item.engagement.packAmount)}</dd>
          </div>
        )}
        {item.engagement.notes?.trim() && (
          <div className="pkg-detail-grid__full">
            <dt>הערות</dt>
            <dd>{item.engagement.notes.trim()}</dd>
          </div>
        )}
      </dl>

      {item.progressPercent != null && (
        <div className="pkg-progress pkg-progress--expanded" aria-hidden>
          <div
            className="pkg-progress__fill"
            style={{ width: `${item.progressPercent}%` }}
          />
        </div>
      )}

      {item.sessions.length > 0 && (
        <div className="pkg-session-history">
          <h4 className="pkg-session-history__title">מפגשים אחרונים</h4>
          <ul className="pkg-session-history__list">
            {item.sessions.slice(0, 5).map((s) => (
              <li key={s.id}>
                <span dir="ltr">{formatDate(s.date)}</span>
                {s.notes?.trim() && <span> — {s.notes.trim()}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pkg-summary-row__actions">
        {canRegister && (
          <button
            type="button"
            className="ds-btn ds-btn--primary ds-btn--sm pkg-register-btn"
            onClick={() => {
              onRegisterSession?.();
              navigate(logSessionRoute(item.engagement.id));
            }}
          >
            <Plus size={16} strokeWidth={2} aria-hidden />
            רישום מפגש
          </button>
        )}
        <button
          type="button"
          className="ds-btn ds-btn--outline ds-btn--sm"
          onClick={() => navigate(`/engagements/${item.engagement.id}`)}
        >
          פרטי כרטיסייה
        </button>
      </div>
    </div>
  );
}
