import { FormEvent, useEffect, useMemo, useState } from 'react';
import { LEAD_SOURCE_OPTIONS } from '../data/leadSources';
import { eventValueToInput, type EventFormValues } from '../lib/eventForm';
import { isSourceCategory } from '../lib/sources';
import { getEventSaveWarnings } from '../lib/eventWarnings';
import type { Category, Event, EventTemplate, EventValue, ValueType } from '../types/models';

const VALUE_TYPE_LABELS: Record<ValueType, string> = {
  text: 'טקסט',
  number: 'מספר',
  date: 'תאריך',
  duration: 'שעה (דקות)',
};

export type { EventFormValues };

interface EventFormProps {
  categories: Category[];
  existingEvents?: Event[];
  excludeEventId?: string;
  eventValues?: EventValue[];
  templates?: EventTemplate[];
  initial?: Partial<EventFormValues>;
  submitLabel: string;
  onSubmit: (values: EventFormValues) => void;
}

export function EventForm({
  categories,
  existingEvents = [],
  excludeEventId,
  eventValues = [],
  templates = [],
  initial,
  submitLabel,
  onSubmit,
}: EventFormProps) {
  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive),
    [categories],
  );

  const buildInitialInputs = () => {
    const inputs: Record<string, string> = {};
    for (const cat of activeCategories) {
      const ev = eventValues.find((v) => v.categoryId === cat.id);
      inputs[cat.id] = eventValueToInput(ev, cat);
    }
    return { ...inputs, ...initial?.categoryInputs };
  };

  const [title, setTitle] = useState(initial?.title ?? '');
  const [eventDate, setEventDate] = useState(initial?.eventDate ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [clientEmail, setClientEmail] = useState(initial?.clientEmail ?? '');
  const [clientPhone, setClientPhone] = useState(initial?.clientPhone ?? '');
  const [categoryInputs, setCategoryInputs] = useState(buildInitialInputs);

  const saveWarnings = useMemo(
    () =>
      title.trim() && eventDate
        ? getEventSaveWarnings(
            existingEvents,
            { title, eventDate, location },
            excludeEventId,
          )
        : [],
    [existingEvents, title, eventDate, location, excludeEventId],
  );

  useEffect(() => {
    if (initial) {
      setTitle(initial.title ?? '');
      setEventDate(initial.eventDate ?? '');
      setLocation(initial.location ?? '');
      setNotes(initial.notes ?? '');
      setClientEmail(initial.clientEmail ?? '');
      setClientPhone(initial.clientPhone ?? '');
      setCategoryInputs(buildInitialInputs());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.title, initial?.eventDate]);

  const applyTemplate = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    setTitle(t.title);
    setLocation(t.location);
    setNotes(t.notes);
    setCategoryInputs((prev) => ({ ...prev, ...t.categoryDefaults }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;
    onSubmit({
      title: title.trim(),
      eventDate,
      location: location.trim(),
      notes: notes.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      categoryInputs,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      {templates.length > 0 && (
        <div className="field">
          <label htmlFor="template-pick">תבנית אירוע</label>
          <select
            id="template-pick"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) applyTemplate(e.target.value);
              e.target.value = '';
            }}
          >
            <option value="">בחרו תבנית (אופציונלי)</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label htmlFor="title">שם אירוע</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="לדוגמה: יום הולדת מאיה"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="date">תאריך אירוע</label>
        <input
          id="date"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="loc">מיקום</label>
        <input
          id="loc"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="אופציונלי"
        />
      </div>

      <p style={{ fontWeight: 600, margin: '0.5rem 0 0.25rem', fontSize: '0.9rem' }}>פרטי לקוח</p>
      <div className="field">
        <label htmlFor="client-email">אימייל לקוח</label>
        <input
          id="client-email"
          type="email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          placeholder="לדוגמה: client@example.com"
          dir="ltr"
          autoComplete="email"
        />
      </div>
      <div className="field">
        <label htmlFor="client-phone">טלפון לקוח</label>
        <input
          id="client-phone"
          type="tel"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          placeholder="לדוגמה: 050-1234567"
          dir="ltr"
          autoComplete="tel"
        />
      </div>

      <div className="field">
        <label htmlFor="notes">הערות</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {activeCategories.length > 0 && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1rem 0' }} />
          <p style={{ fontWeight: 600, margin: '0 0 0.75rem' }}>שדות לפי קטגוריה</p>
          {activeCategories.map((cat) => (
            <div key={cat.id} className="field">
              <label htmlFor={`cat-${cat.id}`}>
                {cat.name}
                {!isSourceCategory(cat.name) && ` (${VALUE_TYPE_LABELS[cat.valueType]})`}
              </label>
              {isSourceCategory(cat.name) ? (
                <select
                  id={`cat-${cat.id}`}
                  value={categoryInputs[cat.id] ?? ''}
                  onChange={(e) =>
                    setCategoryInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))
                  }
                >
                  <option value="">בחרו מקור הגעה</option>
                  {LEAD_SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`cat-${cat.id}`}
                  type={
                    cat.valueType === 'number' || cat.valueType === 'duration'
                      ? 'number'
                      : cat.valueType === 'date'
                        ? 'date'
                        : 'text'
                  }
                  value={categoryInputs[cat.id] ?? ''}
                  onChange={(e) =>
                    setCategoryInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))
                  }
                />
              )}
            </div>
          ))}
        </>
      )}

      {saveWarnings.length > 0 && (
        <div className="event-save-warnings" role="alert">
          {saveWarnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
          <p className="event-save-warnings-note">אפשר לשמור בכל זאת — תתבקשו לאשר.</p>
        </div>
      )}

      <button type="submit" className="btn btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
