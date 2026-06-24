import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchAll } from '../lib/search';
import { useAppStore } from '../store/useAppStore';

const KIND_LABEL: Record<string, string> = {
  event: 'אירוע',
  lead: 'ליד',
  invoice: 'חשבונית',
  customer: 'לקוח',
  engagement: 'פעילות',
  task: 'משימה',
};

export function GlobalSearch() {
  const events = useAppStore((s) => s.events);
  const leads = useAppStore((s) => s.leads);
  const invoices = useAppStore((s) => s.invoices);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const engagements = useAppStore((s) => s.engagements ?? []);
  const tasks = useAppStore((s) => s.tasks ?? []);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(
    () =>
      searchAll(
        query,
        events,
        leads,
        invoices,
        categories,
        eventValues,
        engagements,
        tasks,
      ),
    [query, events, leads, invoices, categories, eventValues, engagements, tasks],
  );

  return (
    <div className="global-search">
      <input
        type="search"
        className="global-search-input"
        placeholder="חיפוש לקוחות, פעילויות, חשבוניות..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(e.target.value.length >= 2);
        }}
        onFocus={() => query.length >= 2 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="חיפוש גלובלי"
      />
      {open && results.length > 0 && (
        <ul className="global-search-results">
          {results.map((r) => (
            <li key={`${r.kind}-${r.id}`}>
              <Link
                to={r.href}
                className="global-search-item"
                onClick={() => {
                  setQuery('');
                  setOpen(false);
                }}
              >
                <span className="global-search-kind">{KIND_LABEL[r.kind]}</span>
                <span className="global-search-title">{r.title}</span>
                <span className="global-search-sub">{r.subtitle}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {open && query.length >= 2 && results.length === 0 && (
        <p className="global-search-empty">לא נמצאו תוצאות</p>
      )}
    </div>
  );
}
