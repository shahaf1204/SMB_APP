import { useCallback, useMemo, useState, type PointerEvent } from 'react';
import { useDragSelection } from '../hooks/useDragSelection';
import type { SelectionMode } from '../hooks/useDragSelection';
import { eventStatus } from '../lib/eventStatus';
import type { Category, Event, EventValue } from '../types/models';
import { EventDetailPanel } from './EventDetailPanel';

interface DashboardCalendarProps {
  events: Event[];
  categories: Category[];
  eventValues: EventValue[];
  selectedEventIds: Set<string>;
  onApplySelection: (ids: string[], mode: SelectionMode) => void;
  onClearSelection: () => void;
  onDeleteEvent?: (id: string) => void;
}

const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const MAX_CHIPS_ON_DAY = 2;

function monthTitle(date: Date): string {
  return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dominantStatus(dayEvents: Event[]): 'past' | 'today' | 'future' | null {
  if (dayEvents.length === 0) return null;
  if (dayEvents.some((e) => eventStatus(e.eventDate) === 'today')) return 'today';
  if (dayEvents.some((e) => eventStatus(e.eventDate) === 'future')) return 'future';
  return 'past';
}

export function DashboardCalendar({
  events,
  categories,
  eventValues,
  selectedEventIds,
  onApplySelection,
  onClearSelection,
  onDeleteEvent,
}: DashboardCalendarProps) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);

  const drag = useDragSelection(selectedEventIds, onApplySelection);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
      ),
    [events],
  );

  const monthEvents = useMemo(
    () =>
      sortedEvents.filter((event) => {
        const d = new Date(event.eventDate);
        return (
          d.getFullYear() === monthCursor.getFullYear() &&
          d.getMonth() === monthCursor.getMonth()
        );
      }),
    [sortedEvents, monthCursor],
  );

  const eventsByDateKey = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const event of monthEvents) {
      const key = event.eventDate;
      const current = map.get(key) ?? [];
      current.push(event);
      map.set(key, current);
    }
    return map;
  }, [monthEvents]);

  const selectedDayEvents = selectedDay ? eventsByDateKey.get(selectedDay) ?? [] : [];
  const focusedEvent = focusedEventId
    ? events.find((e) => e.id === focusedEventId) ?? null
    : null;

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const openEventDetail = useCallback((event: Event) => {
    setSelectedDay(event.eventDate);
    setFocusedEventId(event.id);
  }, []);

  const handleDayClick = (iso: string, dayEvents: Event[]) => {
    if (dayEvents.length === 0) {
      setSelectedDay(null);
      setFocusedEventId(null);
      return;
    }
    setFocusedEventId(null);
    setSelectedDay((prev) => (prev === iso ? null : iso));
  };

  const handleEventPointerDown = useCallback(
    (eventId: string, e: PointerEvent<HTMLSpanElement>) => {
      e.preventDefault();
      e.stopPropagation();
      drag.start(eventId);
    },
    [drag],
  );

  const formatDayLabel = (iso: string) =>
    new Date(iso).toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const toggleFocusedSelect = () => {
    if (!focusedEventId) return;
    const mode = selectedEventIds.has(focusedEventId) ? 'deselect' : 'select';
    onApplySelection([focusedEventId], mode);
  };

  return (
    <section
      className={`card calendar-card ${drag.isDragging ? 'is-drag-selecting' : ''}`}
      style={{ marginBottom: '1rem' }}
    >
      <div className="calendar-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>יומן אירועים</h2>
          <p className="calendar-drag-hint">לחצו על אירוע לפרטים · גררו ⋮⋮ לסימון</p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            className="chip"
            onClick={() => {
              setMonthCursor(new Date(year, month - 1, 1));
              setSelectedDay(null);
              setFocusedEventId(null);
            }}
            aria-label="חודש קודם"
          >
            קודם
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => {
              setMonthCursor(new Date(year, month + 1, 1));
              setSelectedDay(null);
              setFocusedEventId(null);
            }}
            aria-label="חודש הבא"
          >
            הבא
          </button>
        </div>
      </div>

      <p style={{ margin: '0.3rem 0 0.5rem', fontWeight: 600 }}>{monthTitle(monthCursor)}</p>

      <div className="calendar-legend calendar-legend-compact">
        <span className="status-pill status-past">עבר</span>
        <span className="status-pill status-today">היום</span>
        <span className="status-pill status-future">עתידי</span>
      </div>

      <div className="calendar-grid weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid calendar-grid-days calendar-grid-rich">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-cell empty" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const iso = dateKey(year, month, dayNum);
          const dayEvents = eventsByDateKey.get(iso) ?? [];
          const dayEventIds = dayEvents.map((event) => event.id);
          const allDaySelected =
            dayEventIds.length > 0 &&
            dayEventIds.every((eventId) => selectedEventIds.has(eventId));
          const status = dominantStatus(dayEvents);
          const isOpen = selectedDay === iso;
          const visible = dayEvents.slice(0, MAX_CHIPS_ON_DAY);
          const overflow = dayEvents.length - visible.length;

          return (
            <button
              key={iso}
              type="button"
              className={`calendar-cell calendar-cell-btn ${status ? `calendar-day-${status}` : ''} ${allDaySelected ? 'selected' : ''} ${isOpen ? 'open' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
              onClick={() => handleDayClick(iso, dayEvents)}
              aria-label={
                dayEvents.length > 0
                  ? `יום ${dayNum}, ${dayEvents.length} אירועים`
                  : `יום ${dayNum}, ללא אירועים`
              }
              aria-expanded={isOpen}
            >
              <span className="calendar-day-num">{dayNum}</span>
              {dayEvents.length > 0 && (
                <div className="calendar-day-events">
                  {visible.map((ev) => (
                    <span
                      key={ev.id}
                      role="button"
                      tabIndex={0}
                      className={`calendar-event-chip status-${eventStatus(ev.eventDate)} ${focusedEventId === ev.id ? 'chip-focused' : ''}`}
                      title={ev.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEventDetail(ev);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          openEventDetail(ev);
                        }
                      }}
                    >
                      {ev.title}
                    </span>
                  ))}
                  {overflow > 0 && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="calendar-event-more"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusedEventId(null);
                        setSelectedDay(iso);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setFocusedEventId(null);
                          setSelectedDay(iso);
                        }
                      }}
                    >
                      +{overflow}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && selectedDayEvents.length > 0 && (
        <div className="calendar-day-panel">
          <div className="calendar-day-panel-head">
            <div>
              <p className="calendar-day-panel-title">{formatDayLabel(selectedDay)}</p>
              <p className="calendar-day-panel-sub">
                {focusedEvent ? 'פרטי אירוע' : `${selectedDayEvents.length} אירועים`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {selectedEventIds.size > 0 && !focusedEvent && (
                <button type="button" className="chip" onClick={onClearSelection}>
                  נקה ({selectedEventIds.size})
                </button>
              )}
              <button
                type="button"
                className="chip"
                onClick={() => {
                  setSelectedDay(null);
                  setFocusedEventId(null);
                }}
              >
                סגור
              </button>
            </div>
          </div>

          {focusedEvent ? (
            <EventDetailPanel
              event={focusedEvent}
              categories={categories}
              eventValues={eventValues}
              isSelected={selectedEventIds.has(focusedEvent.id)}
              onClose={() => setFocusedEventId(null)}
              onToggleSelect={toggleFocusedSelect}
              onDelete={
                onDeleteEvent
                  ? () => {
                      onDeleteEvent(focusedEvent.id);
                      setFocusedEventId(null);
                      setSelectedDay(null);
                    }
                  : undefined
              }
            />
          ) : (
            <ul className="calendar-day-panel-list">
              {selectedDayEvents.map((event) => {
                const status = eventStatus(event.eventDate);
                const selected = selectedEventIds.has(event.id);
                return (
                  <li key={event.id}>
                    <div
                      className={`event-row event-row-compact ${selected ? 'selected' : ''}`}
                    >
                      <span
                        className="event-drag-handle"
                        aria-label="גרור לסימון"
                        onPointerDown={(e) => handleEventPointerDown(event.id, e)}
                        onPointerEnter={() => drag.enter(event.id)}
                        onPointerMove={() => drag.enter(event.id)}
                      >
                        ⋮⋮
                      </span>
                      <button
                        type="button"
                        className="event-row-open"
                        onClick={() => openEventDetail(event)}
                      >
                        <p className="calendar-panel-event-title">{event.title}</p>
                        {event.location && (
                          <p className="calendar-panel-event-meta">📍 {event.location}</p>
                        )}
                      </button>
                      <span className={`status-pill status-${status}`}>
                        {status === 'past' ? 'עבר' : status === 'today' ? 'היום' : 'עתידי'}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {monthEvents.length === 0 && (
        <p className="empty-state calendar-empty-month">אין אירועים בחודש הזה</p>
      )}
    </section>
  );
}
