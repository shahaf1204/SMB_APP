import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { EventForm, type EventFormValues } from '../components/EventForm';
import { buildEventValuesFromInputs, eventFormToEventPayload } from '../lib/eventForm';
import { confirmEventSaveDespiteWarnings, getEventSaveWarnings } from '../lib/eventWarnings';
import { afterEventSaved } from '../lib/postEventSave';
import { useAppStore } from '../store/useAppStore';

export function AddEventPage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user)!;
  const business = useAppStore((s) => s.business)!;
  const categories = useAppStore((s) => s.categories);
  const events = useAppStore((s) => s.events);
  const eventTemplates = useAppStore((s) => s.eventTemplates);
  const addEvent = useAppStore((s) => s.addEvent);
  const ensureCustomerSourceCategory = useAppStore((s) => s.ensureCustomerSourceCategory);

  useEffect(() => {
    ensureCustomerSourceCategory();
  }, [ensureCustomerSourceCategory]);

  const handleSubmit = async (form: EventFormValues) => {
    const warnings = getEventSaveWarnings(events, form);
    if (!confirmEventSaveDespiteWarnings(warnings)) return;

    const values = buildEventValuesFromInputs(
      '',
      business.id,
      user.id,
      categories,
      form.categoryInputs,
      [],
    );
    const eventId = addEvent(eventFormToEventPayload(form), values);
    if (!eventId) return;

    const state = useAppStore.getState();
    const saved = state.events.find((e) => e.id === eventId);
    const calendarExport = saved
      ? await afterEventSaved(saved, state.events)
      : null;

    navigate(
      '/dashboard',
      calendarExport ? { state: { calendarExport } } : undefined,
    );
  };

  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">אירוע חדש</h1>
        <p className="page-subtitle">מילוי מהיר — פחות מדקה</p>
        <EventForm
          categories={categories}
          existingEvents={events}
          templates={eventTemplates}
          submitLabel="שמור אירוע"
          onSubmit={(form) => void handleSubmit(form)}
        />
      </div>
      <BottomNav />
    </div>
  );
}
