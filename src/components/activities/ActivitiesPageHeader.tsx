import { CreateActivityButton } from '../create/CreateActivityButton';
import { Text } from '../ds/Text';

interface ActivitiesPageHeaderProps {
  title: string;
  subtitle: string;
  count?: number;
  ctaLabel: string;
}

export function ActivitiesPageHeader({
  title,
  subtitle,
  count,
  ctaLabel,
}: ActivitiesPageHeaderProps) {
  return (
    <header className="activities-page-header">
      <div className="activities-page-header__text">
        <h1 className="page-title">{title}</h1>
        <Text variant="small" tone="muted" className="activities-page-header__subtitle">
          {subtitle}
          {count != null && count > 0 && (
            <span className="activities-page-header__count"> · {count} פעילויות</span>
          )}
        </Text>
      </div>
      <CreateActivityButton label={ctaLabel} className="btn btn-primary btn-sm activities-page-header__cta" />
    </header>
  );
}
