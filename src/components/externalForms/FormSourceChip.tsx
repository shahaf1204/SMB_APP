import { externalFormEventBadge } from '../../lib/externalForms/badges';
import type { Event } from '../../types/models';

interface FormSourceChipProps {
  event: Event;
}

export function FormSourceChip({ event }: FormSourceChipProps) {
  const label = externalFormEventBadge(event);
  if (!label) return null;
  return <span className="form-source-chip">{label}</span>;
}
