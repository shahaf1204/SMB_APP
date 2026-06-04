import { formatCurrency, formatDate } from '../lib/finance';
import type { Event } from '../types/models';

interface NextEventCardProps {
  event: Event | null;
  clientName: string | null;
  amount: number;
}

export function NextEventCard({ event, clientName, amount }: NextEventCardProps) {
  if (!event) {
    return (
      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>אירוע קרוב</h2>
        <p className="empty-state" style={{ padding: '0.5rem 0', margin: 0 }}>
          אין אירועים עתידיים
        </p>
      </section>
    );
  }

  return (
    <section className="card" style={{ marginBottom: '1rem' }}>
      <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>אירוע קרוב</h2>
      <p style={{ margin: 0, fontWeight: 600, fontSize: '1.05rem' }}>
        {clientName ?? event.title}
      </p>
      <p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
        {formatDate(event.eventDate)}
      </p>
      {event.location && (
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>📍 {event.location}</p>
      )}
      <p
        style={{
          margin: '0.75rem 0 0',
          fontWeight: 700,
          color: 'var(--color-primary)',
          fontSize: '1.125rem',
        }}
      >
        {formatCurrency(amount)}
      </p>
    </section>
  );
}
