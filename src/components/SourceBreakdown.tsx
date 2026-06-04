import type { SourceCount } from '../lib/sources';

interface SourceBreakdownProps {
  data: SourceCount[];
}

export function SourceBreakdown({ data }: SourceBreakdownProps) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <section className="card" style={{ marginBottom: '1rem' }}>
      <p style={{ margin: '0 0 0.65rem', fontSize: '0.875rem', fontWeight: 600 }}>
        מאיפה מגיעים הלקוחות?
      </p>
      {data.length === 0 || total === 0 ? (
        <p className="empty-state" style={{ padding: '0.5rem 0', margin: 0 }}>
          הוסיפו &quot;מקור הגעה&quot; באירועים כדי לראות ניתוח
        </p>
      ) : (
        <ul className="source-list">
          {data.map((row) => (
            <li key={row.source} className="source-row">
              <div className="source-row-head">
                <span>{row.source}</span>
                <span>
                  {row.count} ({Math.round((row.count / total) * 100)}%)
                </span>
              </div>
              <div className="source-bar-track">
                <div
                  className="source-bar-fill"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
