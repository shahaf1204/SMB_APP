import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface LightFormSectionProps {
  title: string;
  children: ReactNode;
  collapsedByDefault?: boolean;
  className?: string;
}

/** Lightweight section header — no heavy card wrapper */
export function LightFormSection({
  title,
  children,
  collapsedByDefault = false,
  className = '',
}: LightFormSectionProps) {
  const [open, setOpen] = useState(!collapsedByDefault);

  if (collapsedByDefault) {
    return (
      <section className={`activity-form-section activity-form-section--collapsible ${className}`.trim()}>
        <button
          type="button"
          className="activity-form-section__trigger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="activity-form-section__title">{title}</span>
          <ChevronDown
            size={18}
            className={`activity-form-section__chevron ${open ? 'activity-form-section__chevron--open' : ''}`}
            aria-hidden
          />
        </button>
        {open && <div className="activity-form-section__body">{children}</div>}
      </section>
    );
  }

  return (
    <section className={`activity-form-section ${className}`.trim()}>
      <h2 className="activity-form-section__title activity-form-section__title--static">{title}</h2>
      <div className="activity-form-section__body">{children}</div>
    </section>
  );
}
