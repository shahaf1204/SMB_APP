/** Skeleton placeholders while store hydrates */
export function ActivitiesPageSkeleton() {
  return (
    <div className="activities-page-skeleton" aria-busy="true" aria-label="טוען פעילויות">
      <div className="activities-page-skeleton__header">
        <div className="activities-page-skeleton__line activities-page-skeleton__line--title" />
        <div className="activities-page-skeleton__line activities-page-skeleton__line--subtitle" />
      </div>
      <div className="activities-page-skeleton__search" />
      <div className="activities-page-skeleton__chips" />
      <div className="activities-page-skeleton__hero" />
      <div className="activities-page-skeleton__card" />
      <div className="activities-page-skeleton__card" />
    </div>
  );
}
