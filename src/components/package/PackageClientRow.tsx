import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { PackageClientGroup } from '../../lib/package/packageClientList';
import { canLogPackageSession } from '../../lib/package/packageClientList';
import type { Invoice } from '../../types/models';
import { PackageLogSessionButton } from './PackageLogSessionButton';
import { PackageSummaryRow } from './PackageSummaryRow';

interface PackageClientRowProps {
  group: PackageClientGroup;
  invoices: Invoice[];
  defaultExpanded?: boolean;
}

/** Client-first compact row with progressive disclosure */
export function PackageClientRow({
  group,
  invoices,
  defaultExpanded = false,
}: PackageClientRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const singlePackage = group.packages.length === 1;
  const primary = group.packages[0];
  const showPrimarySessionAction =
    !expanded && singlePackage && primary != null && canLogPackageSession(primary);

  const statusPill =
    group.packages.find((p) => p.status !== 'active') ?? null;

  return (
    <article className={`pkg-client-row${expanded ? ' pkg-client-row--expanded' : ''}`}>
      <div className="pkg-client-row__surface">
        <button
          type="button"
          className="pkg-client-row__main"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="pkg-client-row__content">
            <div className="pkg-client-row__header">
              <h3 className="pkg-client-row__name">{group.clientName}</h3>
              {statusPill && !expanded && (
                <span className={`pkg-status-pill pkg-status-pill--${statusPill.status}`}>
                  {statusPill.statusLabel}
                </span>
              )}
            </div>

            {!expanded && singlePackage && primary && (
              <>
                <span className="pkg-client-row__package">{primary.engagement.title}</span>
                <span className="pkg-client-row__usage">{primary.usageLabel}</span>
                {primary.progressPercent != null && (
                  <div className="pkg-progress" aria-hidden>
                    <div
                      className="pkg-progress__fill"
                      style={{ width: `${primary.progressPercent}%` }}
                    />
                  </div>
                )}
                {primary.expirationLabel && (
                  <span className="pkg-client-row__expiry">{primary.expirationLabel}</span>
                )}
              </>
            )}

            {!expanded && !singlePackage && (
              <div className="pkg-client-row__multi">
                {group.packages.map((item) => (
                  <PackageSummaryRow
                    key={item.engagement.id}
                    item={item}
                    invoices={invoices}
                    clientKey={group.clientKey}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        </button>

        <div className="pkg-client-row__aside">
          {showPrimarySessionAction && primary && (
            <PackageLogSessionButton
              packageId={primary.engagement.id}
              clientKey={group.clientKey}
              compact
            />
          )}
          <button
            type="button"
            className="pkg-client-row__chevron-btn"
            aria-expanded={expanded}
            aria-label={expanded ? 'סגירת פרטים' : 'הצגת פרטים'}
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronDown
              size={20}
              className={`pkg-client-row__chevron${expanded ? ' open' : ''}`}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="pkg-client-row__details">
          {group.packages.map((item) => (
            <PackageSummaryRow
              key={item.engagement.id}
              item={item}
              invoices={invoices}
              clientKey={group.clientKey}
            />
          ))}
        </div>
      )}
    </article>
  );
}
