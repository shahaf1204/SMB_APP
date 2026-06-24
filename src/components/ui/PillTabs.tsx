interface PillTabsProps<T extends string> {
  tabs: Array<{ id: T; label: string }>;
  active: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}

export function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
}: PillTabsProps<T>) {
  return (
    <div className="pill-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`pill-tab ${active === tab.id ? 'pill-tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
