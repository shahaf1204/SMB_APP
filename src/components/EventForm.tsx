import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LEAD_SOURCE_OPTIONS } from '../data/leadSources';
import { sortCategories } from '../lib/categories';
import { includesDirectExpenses, resolveExpenseTrackingMode } from '../lib/monthlyExpenses';
import { resolveActivityFormSchemaFromCategories } from '../lib/activityForm/resolveActivityFormSchema';
import { formCopyText } from '../config/businessFormCopy';
import { resolveWorkspace } from '../lib/workspace';
import { isSourceCategory } from '../lib/sources';
import { getEventSaveWarnings } from '../lib/eventWarnings';
import { eventValueToInput, type EventFormValues } from '../lib/eventForm';
import { ClientFieldGroup } from './activityForm/ClientFieldGroup';
import { LightFormSection } from './activityForm/LightFormSection';
import { useAppStore } from '../store/useAppStore';
import type {
  ActivityFormFieldPresentation,
  ActivityFormSchemaSection,
} from '../lib/activityForm/types';
import type { Category, Event, EventTemplate, EventValue, ValueType } from '../types/models';

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

function inputTypeForValueType(valueType: ValueType): string {
  if (valueType === 'number' || valueType === 'duration') return 'number';
  if (valueType === 'date') return 'date';
  return 'text';
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
  const business = useAppStore((s) => s.business);
  const events = useAppStore((s) => s.events);
  const leads = useAppStore((s) => s.leads);
  const invoices = useAppStore((s) => s.invoices);
  const allEventValues = useAppStore((s) => s.eventValues);

  const workspace = resolveWorkspace(business);
  const operatingModel = workspace?.primaryOperatingModel ?? 'event';
  const businessType = business?.presetId ?? business?.businessType;

  const showDirectExpenses = includesDirectExpenses(resolveExpenseTrackingMode(business));

  const activeCategories = useMemo(
    () => sortCategories(categories.filter((c) => c.isActive)),
    [categories],
  );

  const schema = useMemo(
    () =>
      resolveActivityFormSchemaFromCategories({
        categories: activeCategories.map((c) => ({
          id: c.id,
          name: c.name,
          valueType: c.valueType,
          metricRole: c.metricRole,
          isActive: c.isActive,
          templateKey: c.templateKey,
          sortOrder: c.sortOrder,
        })),
        businessType,
        operatingModel,
      }),
    [activeCategories, businessType, operatingModel],
  );

  const clientCategory = activeCategories.find(
    (c) => c.templateKey === 'client_name' || c.name.includes('לקוח') || c.name.includes('מטופל'),
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

  const clientValue = clientCategory ? categoryInputs[clientCategory.id] ?? '' : '';

  const titlePlaceholder = formCopyText(
    { businessType, operatingModel, fieldKey: 'title' },
    'placeholder',
    'למשל: פעילות חדשה',
  );

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

  const renderBuiltinField = (field: ActivityFormFieldPresentation) => {
    switch (field.builtin) {
      case 'title':
        return (
          <div key={field.key} className="field">
            <label htmlFor="title">{field.label}</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={titlePlaceholder}
              required
            />
          </div>
        );
      case 'date':
        return (
          <div key={field.key} className="field">
            <label htmlFor="date">{field.label}</label>
            <input
              id="date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>
        );
      case 'location':
        return (
          <div key={field.key} className="field">
            <label htmlFor="loc">{field.label}</label>
            <input
              id="loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="אופציונלי"
            />
          </div>
        );
      case 'notes':
        return (
          <div key={field.key} className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="notes">{field.label}</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderCategoryField = (field: ActivityFormFieldPresentation) => {
    const catId = field.categoryId;
    if (!catId) return null;
    const cat = activeCategories.find((c) => c.id === catId);
    if (!cat) return null;

    const isSource = isSourceCategory(cat.name);

    return (
      <div key={field.key} className="field">
        <label htmlFor={`cat-${cat.id}`}>{field.label}</label>
        {isSource ? (
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
            type={inputTypeForValueType(cat.valueType)}
            value={categoryInputs[cat.id] ?? ''}
            onChange={(e) =>
              setCategoryInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))
            }
          />
        )}
      </div>
    );
  };

  const renderSectionFields = (section: ActivityFormSchemaSection) => {
    if (section.id === 'client') {
      return (
        <ClientFieldGroup
          clientCategory={clientCategory}
          clientValue={clientValue}
          onClientValueChange={(value) => {
            if (!clientCategory) return;
            setCategoryInputs((prev) => ({ ...prev, [clientCategory.id]: value }));
          }}
          clientEmail={clientEmail}
          clientPhone={clientPhone}
          onClientEmailChange={setClientEmail}
          onClientPhoneChange={setClientPhone}
          events={events}
          leads={leads}
          invoices={invoices}
          categories={categories}
          eventValues={allEventValues}
        />
      );
    }

    return section.fields.map((field) => {
      if (field.builtin) return renderBuiltinField(field);
      if (field.section === 'client') return null;
      return renderCategoryField(field);
    });
  };

  const financialSection = schema.sections.find((s) => s.id === 'financial');

  return (
    <form onSubmit={handleSubmit} className="form-stack activity-form">
      {templates.length > 0 && (
        <div className="activity-form-template-pick field">
          <label htmlFor="template-pick">תבנית (אופציונלי)</label>
          <select
            id="template-pick"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) applyTemplate(e.target.value);
              e.target.value = '';
            }}
          >
            <option value="">ללא תבנית</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {schema.sections.map((section) => {
        const fieldsInSection = section.fields.filter((f) => {
          if (f.builtin === 'notes' && section.id !== 'notes') return false;
          if (f.section === 'client' && section.id !== 'client') return false;
          return true;
        });
        if (!fieldsInSection.length && section.id !== 'client') return null;
        if (section.id === 'client' && !clientCategory) return null;

        return (
          <LightFormSection
            key={section.id}
            title={section.titleHe}
            collapsedByDefault={section.collapsedByDefault}
          >
            {renderSectionFields({ ...section, fields: fieldsInSection })}
            {section.id === 'financial' && !showDirectExpenses && financialSection && (
              <p className="field-hint" style={{ marginBottom: 0 }}>
                הוצאות העסק מדווחות ב
                <Link to="/settings/monthly-expenses"> הוצאות חודשיות</Link>
              </p>
            )}
          </LightFormSection>
        );
      })}

      {saveWarnings.length > 0 && (
        <div className="event-save-warnings card" role="alert">
          {saveWarnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
          <p className="event-save-warnings-note">אפשר לשמור בכל זאת — תתבקשו לאשר.</p>
        </div>
      )}

      <button type="submit" className="btn btn-primary form-submit-btn">
        {submitLabel}
      </button>
    </form>
  );
}
