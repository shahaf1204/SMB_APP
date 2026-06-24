import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface FormSectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, icon: Icon, children, className = '' }: FormSectionProps) {
  return (
    <section className={`form-section card ${className}`.trim()}>
      <header className="form-section-header">
        {Icon && (
          <span className="form-section-icon" aria-hidden>
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
        <h2 className="form-section-title">{title}</h2>
      </header>
      <div className="form-section-body">{children}</div>
    </section>
  );
}
