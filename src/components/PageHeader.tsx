interface PageHeaderProps {
  userName?: string;
  subtitle?: string;
}

export function PageHeader({ userName, subtitle }: PageHeaderProps) {
  return (
    <header className="page-header">
      <p className="page-header-greeting">שלום 👋</p>
      <h1 className="page-header-title">
        {userName ? `היי, ${userName}` : 'ברוכים הבאים'}
      </h1>
      <p className="page-header-sub">
        {subtitle ?? 'הנה סיכום העסק שלך להיום'}
      </p>
    </header>
  );
}
