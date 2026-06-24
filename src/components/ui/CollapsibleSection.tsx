import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  variant?: 'default' | 'highlight' | 'muted';
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  variant = 'default',
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`collapse-section collapse-section--${variant}`}>
      <button
        type="button"
        className="collapse-section-header"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="collapse-section-title">
          {title}
          {count != null && count > 0 && (
            <span className="collapse-section-count">{count}</span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={`collapse-section-chevron ${open ? 'open' : ''}`}
          aria-hidden
        />
      </button>
      {open && <div className="collapse-section-body">{children}</div>}
    </section>
  );
}
