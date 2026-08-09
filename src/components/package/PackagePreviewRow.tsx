import { Link } from 'react-router-dom';
import type { PackagePreviewItem } from '../../lib/package/packagePreview';

interface PackagePreviewRowProps {
  item: PackagePreviewItem;
  showUsage?: boolean;
}

/** Compact dashboard preview row — not a full ActivityCard */
export function PackagePreviewRow({ item, showUsage = true }: PackagePreviewRowProps) {
  return (
    <Link
      to={`/engagements/${item.engagementId}`}
      className="pkg-preview-row"
    >
      <div className="pkg-preview-row__main">
        <span className="pkg-preview-row__client">{item.clientName}</span>
        <span className="pkg-preview-row__package">{item.packageName}</span>
        {showUsage && (
          <span className="pkg-preview-row__usage">{item.usageLabel}</span>
        )}
        {item.contextLabel && (
          <span className="pkg-preview-row__context">{item.contextLabel}</span>
        )}
      </div>
      {item.progressPercent != null && (
        <div className="pkg-progress pkg-progress--inline" aria-hidden>
          <div
            className="pkg-progress__fill"
            style={{ width: `${item.progressPercent}%` }}
          />
        </div>
      )}
    </Link>
  );
}

interface PackageDashboardPreviewSectionProps {
  title: string;
  items: PackagePreviewItem[];
  totalCount: number;
  viewAllHref: string;
  showUsage?: boolean;
}

export function PackageDashboardPreviewSection({
  title,
  items,
  totalCount,
  viewAllHref,
  showUsage = true,
}: PackageDashboardPreviewSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="dash-v2-section dash-v2-section--tight pkg-preview-section" aria-label={title}>
      <div className="dash-v2-section-head dash-v2-section-head--compact">
        <h2 className="dash-v2-section-title">
          {title}
          {totalCount > 0 && (
            <span className="dash-v2-package-section-count">{totalCount}</span>
          )}
        </h2>
      </div>
      <ul className="pkg-preview-list">
        {items.map((item) => (
          <li key={item.engagementId}>
            <PackagePreviewRow item={item} showUsage={showUsage} />
          </li>
        ))}
      </ul>
      {totalCount > items.length && (
        <Link to={viewAllHref} className="pkg-preview-view-all">
          הצג הכל
        </Link>
      )}
    </section>
  );
}
