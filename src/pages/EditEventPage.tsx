import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { EventForm, type EventFormValues } from '../components/EventForm';
import { eventFormToEventPayload } from '../lib/eventForm';
import { confirmEventSaveDespiteWarnings, getEventSaveWarnings } from '../lib/eventWarnings';
import { afterEventSaved } from '../lib/postEventSave';
import { useAppStore } from '../store/useAppStore';

export function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const events = useAppStore((s) => s.events);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const eventTemplates = useAppStore((s) => s.eventTemplates);
  const updateEvent = useAppStore((s) => s.updateEvent);
  const deleteEvent = useAppStore((s) => s.deleteEvent);

  const event = events.find((e) => e.id === id);
  const valuesForEvent = useMemo(
    () => eventValues.filter((ev) => ev.eventId === id),
    [eventValues, id],
  );

  if (!event) {
    return (
      <div className="app-shell">
        <div className="page">
          <p>אירוע לא נמצא</p>
          <Link to="/dashboard">חזרה לדשבורד</Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const handleSubmit = async (form: EventFormValues) => {
    const warnings = getEventSaveWarnings(events, form, event.id);
    if (!confirmEventSaveDespiteWarnings(warnings)) return;

    updateEvent(event.id, eventFormToEventPayload(form), form.categoryInputs);
    const state = useAppStore.getState();
    const updated = state.events.find((e) => e.id === event.id);
    const calendarExport = updated
      ? await afterEventSaved(updated, state.events)
      : null;
    navigate(
      '/dashboard',
      calendarExport ? { state: { calendarExport } } : undefined,
    );
  };

  const handleDelete = () => {
    if (!window.confirm(`למחוק את "${event.title}"?`)) return;
    deleteEvent(event.id);
    navigate('/dashboard');
  };

  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">עריכת אירוע</h1>
        <p className="page-subtitle">{event.title}</p>

        <EventForm
          categories={categories}
          existingEvents={events}
          excludeEventId={event.id}
          eventValues={valuesForEvent}
          templates={eventTemplates}
          initial={{
            title: event.title,
            eventDate: event.eventDate,
            location: event.location,
            notes: event.notes,
            clientEmail: event.clientEmail ?? '',
            clientPhone: event.clientPhone ?? '',
          }}
          submitLabel="שמור שינויים"
          onSubmit={(form) => void handleSubmit(form)}
        />

        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: '0.75rem', color: 'var(--color-error)' }}
          onClick={handleDelete}
        >
          מחק אירוע
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
