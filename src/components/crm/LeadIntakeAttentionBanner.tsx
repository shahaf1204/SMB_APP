import { Link } from 'react-router-dom';
import { countUnresolvedIntakeLeads } from '../../lib/crm/leadIntake';
import { useAppStore } from '../../store/useAppStore';

export function LeadIntakeAttentionBanner() {
  const leads = useAppStore((s) => s.leads);
  const count = countUnresolvedIntakeLeads(leads);
  if (count <= 0) return null;

  const label =
    count === 1
      ? 'ליד חדש מחכה לטיפול'
      : `${count} לידים חדשים שמחכים לטיפול`;

  return (
    <section className="lead-intake-attention" role="status" aria-live="polite">
      <div className="lead-intake-attention__inner">
        <p className="lead-intake-attention__title">{label}</p>
        <p className="lead-intake-attention__hint">
          פתיחת האפליקציה או צפייה בליד לא מסמנות אותו כטופל — נדרש אישור או דחייה.
        </p>
        <Link to="/leads?intake=unresolved" className="btn btn-primary btn-sm lead-intake-attention__cta">
          לצפייה בלידים
        </Link>
      </div>
    </section>
  );
}
