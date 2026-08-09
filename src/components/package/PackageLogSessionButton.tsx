import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logSessionRoute } from '../../lib/package/resolvePackageDashboardConfig';

interface PackageLogSessionButtonProps {
  /** Engagement id — the exact package to register against */
  packageId: string;
  /** Client grouping key — passed explicitly for context-safe navigation */
  clientKey: string;
  /** Shorter label for tight rows */
  compact?: boolean;
}

/** Context-bound session registration — never infers package from global state */
export function PackageLogSessionButton({
  packageId,
  clientKey,
  compact = false,
}: PackageLogSessionButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={`pkg-log-session-btn${compact ? ' pkg-log-session-btn--compact' : ''}`}
      aria-label={compact ? 'רישום מפגש' : undefined}
      onClick={(e) => {
        e.stopPropagation();
        navigate(logSessionRoute(packageId, clientKey));
      }}
    >
      <Plus size={compact ? 16 : 18} strokeWidth={2} aria-hidden />
      <span>{compact ? 'מפגש' : 'רישום מפגש'}</span>
    </button>
  );
}
