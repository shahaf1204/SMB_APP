interface PageHeaderProps {
  userName?: string;
}

export function PageHeader({ userName }: PageHeaderProps) {
  return (
    <header className="page-header">
      <h1 className="page-header-welcome">
        היי {userName ?? 'שם'} 👋
      </h1>
      <p className="page-header-sub">הנה מה שקורה בעסק שלך היום</p>
    </header>
  );
}
