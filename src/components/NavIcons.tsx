interface NavIconProps {
  name: NavIconName;
  active?: boolean;
  size?: number;
}

export type NavIconName =
  | 'today'
  | 'dashboard'
  | 'leads'
  | 'create'
  | 'assistant'
  | 'invoices'
  | 'settings';

export function NavIcon({ name, active = false, size = 22 }: NavIconProps) {
  const color = active ? 'var(--color-primary)' : 'var(--color-text-muted)';
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: active ? 2.2 : 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'today':
      return (
        <svg {...props}>
          <path d="M9 11l2 2 4-4" />
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <path d="M3 10h18" />
          <path d="M8 2v4M16 2v4" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case 'leads':
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'create':
      return (
        <svg width={size + 4} height={size + 4} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 5v14M5 12h14"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'assistant':
      return (
        <svg {...props}>
          <path d="M12 8V4H8" />
          <rect x="4" y="8" width="16" height="12" rx="2" />
          <path d="M2 14h2M20 14h2M12 14v4" />
          <circle cx="9" cy="13" r="1" fill={color} stroke="none" />
          <circle cx="15" cy="13" r="1" fill={color} stroke="none" />
        </svg>
      );
    case 'invoices':
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      );
    default:
      return null;
  }
}
