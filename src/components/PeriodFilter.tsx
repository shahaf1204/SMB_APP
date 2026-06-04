import { PERIOD_LABELS } from '../lib/period';
import type { PeriodFilter as PeriodFilterType } from '../types/models';

const FILTERS: PeriodFilterType[] = [
  'thisMonth',
  'allFuture',
  'lastMonth',
  'nextMonth',
  'last7',
  'last30',
  'ytd',
  'allTime',
];

interface PeriodFilterProps {
  value: PeriodFilterType;
  onChange: (v: PeriodFilterType) => void;
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>תקופה</p>
      <div className="chip-row" role="listbox" aria-label="בחירת תקופה">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="option"
            aria-selected={value === f}
            className={`chip ${value === f ? 'active' : ''}`}
            onClick={() => onChange(f)}
          >
            {PERIOD_LABELS[f]}
          </button>
        ))}
      </div>
    </div>
  );
}
