interface PageHeaderProps {
  userName?: string;
  subtitle?: string;
}

export function PageHeader({ userName, subtitle }: PageHeaderProps) {
  return (
    <header style={{ marginBottom: '1rem' }}>
      <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>היי 👋</p>
      <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)' }}>
        {subtitle ??
          (userName
            ? `${userName}, ברוכה הבאה לדשבורד העסק שלך`
            : 'ברוכה הבאה לדשבורד העסק שלך')}
      </p>
    </header>
  );
}
