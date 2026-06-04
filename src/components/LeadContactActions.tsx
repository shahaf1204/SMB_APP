import { emailLink, phoneTelLink, whatsAppLink } from '../lib/contact';

interface LeadContactActionsProps {
  name: string;
  phone?: string;
  email?: string;
}

export function LeadContactActions({ name, phone, email }: LeadContactActionsProps) {
  const waMsg = `שלום ${name}, ראיתי את הפנייה שלך. אשמח לשוחח על האירוע.`;

  return (
    <div className="contact-actions">
      {phone && (
        <>
          <a className="btn btn-ghost contact-btn" href={phoneTelLink(phone)}>
            📞 התקשר
          </a>
          <a
            className="btn btn-primary contact-btn"
            href={whatsAppLink(phone, waMsg)}
            target="_blank"
            rel="noopener noreferrer"
          >
            וואטסאפ
          </a>
        </>
      )}
      {email && (
        <a className="btn btn-ghost contact-btn" href={emailLink(email)}>
          ✉️ אימייל
        </a>
      )}
    </div>
  );
}
