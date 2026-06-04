import { FormEvent, useState } from 'react';
import type { PastEventOption } from '../lib/assistantEvents';
import {
  ASSISTANT_ACTION_PRESETS,
  ASSISTANT_QUERY_PRESETS,
} from '../lib/assistantPresets';
import { defaultEventDateIso, defaultTaskDueDateIso } from '../lib/smartAssistant';

interface AssistantPresetPanelProps {
  onSend: (prompt: string) => void;
  disabled?: boolean;
  pastEvents: PastEventOption[];
}

function Chevron() {
  return (
    <span className="assistant-accordion-chevron" aria-hidden>
      ◀
    </span>
  );
}

export function AssistantPresetPanel({
  onSend,
  disabled,
  pastEvents,
}: AssistantPresetPanelProps) {
  const [actionValues, setActionValues] = useState<Record<string, Record<string, string>>>({});
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const setField = (presetId: string, fieldId: string, value: string) => {
    setActionValues((prev) => ({
      ...prev,
      [presetId]: { ...prev[presetId], [fieldId]: value },
    }));
    setActionMsg(null);
  };

  const onEventSelect = (eventId: string) => {
    setField('invoice', 'eventId', eventId);
    if (!eventId) return;
    const ev = pastEvents.find((e) => e.id === eventId);
    if (ev?.clientName && !actionValues.invoice?.client?.trim()) {
      setField('invoice', 'client', ev.clientName);
    }
  };

  const handleActionSubmit = (presetId: string, e: FormEvent) => {
    e.preventDefault();
    const preset = ASSISTANT_ACTION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const values = actionValues[presetId] ?? {};
    const prompt = preset.buildPrompt(values);
    if (!prompt) {
      setActionMsg('מלאו את השדות הנדרשים');
      return;
    }
    setActionMsg(null);
    onSend(prompt);
    setActionValues((prev) => ({ ...prev, [presetId]: {} }));
    setOpenActionId(null);
  };

  const openAction = (presetId: string) => {
    const opening = openActionId !== presetId;
    setOpenActionId(opening ? presetId : null);
    if (!opening) return;
    if (presetId === 'event' && !actionValues.event?.eventDate) {
      setField('event', 'eventDate', defaultEventDateIso());
    }
    if (presetId === 'task' && !actionValues.task?.dueDate) {
      setField('task', 'dueDate', defaultTaskDueDateIso());
    }
  };

  const queryCount = ASSISTANT_QUERY_PRESETS.length;
  const actionCount = ASSISTANT_ACTION_PRESETS.length;

  return (
    <details className="assistant-menu-root card">
      <summary className="assistant-menu-root-summary">
        <span className="assistant-menu-root-icon" aria-hidden>
          ✨
        </span>
        <span className="assistant-menu-root-text">
          <span className="assistant-menu-root-title">שאלות ופעולות לעוזר</span>
          <span className="assistant-menu-root-sub">
            {queryCount} שאלות · {actionCount} פעולות
          </span>
        </span>
        <Chevron />
      </summary>

      <div className="assistant-menu-body">
        <details className="assistant-accordion">
          <summary className="assistant-accordion-summary">
            <span className="assistant-accordion-label">
              <span className="assistant-accordion-icon" aria-hidden>
                💬
              </span>
              שאלות על העסק
            </span>
            <span className="assistant-accordion-badge">{queryCount}</span>
            <Chevron />
          </summary>
          <ul className="assistant-menu-list">
            {ASSISTANT_QUERY_PRESETS.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="assistant-menu-item"
                  disabled={disabled}
                  onClick={() => onSend(p.prompt)}
                >
                  <span className="assistant-menu-item-icon" aria-hidden>
                    {p.icon ?? '•'}
                  </span>
                  <span className="assistant-menu-item-text">
                    <span className="assistant-menu-item-label">{p.label}</span>
                    {p.description && (
                      <span className="assistant-menu-item-desc">{p.description}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </details>

        <details className="assistant-accordion">
          <summary className="assistant-accordion-summary">
            <span className="assistant-accordion-label">
              <span className="assistant-accordion-icon" aria-hidden>
                ⚡
              </span>
              פעולות במערכת
            </span>
            <span className="assistant-accordion-badge">{actionCount}</span>
            <Chevron />
          </summary>

          <p className="assistant-menu-note">
            בוחרים פעולה, ממלאים פרטים, ואז מאשרים בצ&apos;אט לפני ביצוע.
          </p>

          <ul className="assistant-menu-list assistant-action-list">
            {ASSISTANT_ACTION_PRESETS.map((preset) => {
              const isOpen = openActionId === preset.id;
              return (
                <li key={preset.id} className={isOpen ? 'is-open' : ''}>
                  <button
                    type="button"
                    className="assistant-menu-item assistant-menu-item-expandable"
                    disabled={disabled}
                    aria-expanded={isOpen}
                    onClick={() => openAction(preset.id)}
                  >
                    <span className="assistant-menu-item-icon" aria-hidden>
                      {preset.icon ?? '•'}
                    </span>
                    <span className="assistant-menu-item-text">
                      <span className="assistant-menu-item-label">{preset.label}</span>
                      <span className="assistant-menu-item-desc">{preset.description}</span>
                    </span>
                    <Chevron />
                  </button>

                  {isOpen && (
                    <form
                      className="assistant-action-panel"
                      onSubmit={(e) => handleActionSubmit(preset.id, e)}
                    >
                      {preset.fields.map((field) => (
                        <div key={field.id} className="field assistant-action-field">
                          <label htmlFor={`${preset.id}-${field.id}`}>{field.label}</label>
                          {field.type === 'event-select' ? (
                            <>
                              <select
                                id={`${preset.id}-${field.id}`}
                                value={actionValues[preset.id]?.[field.id] ?? ''}
                                disabled={disabled}
                                onChange={(e) => onEventSelect(e.target.value)}
                              >
                                <option value="">— בלי קישור לאירוע —</option>
                                {pastEvents.length === 0 ? (
                                  <option value="" disabled>
                                    אין אירועים שעברו עדיין
                                  </option>
                                ) : (
                                  pastEvents.map((ev) => (
                                    <option key={ev.id} value={ev.id}>
                                      {ev.label}
                                    </option>
                                  ))
                                )}
                              </select>
                              {pastEvents.length === 0 && (
                                <p className="field-hint">
                                  הוסיפו אירועים עם תאריך עבר כדי לקשר חשבונית.
                                </p>
                              )}
                            </>
                          ) : (
                            <input
                              id={`${preset.id}-${field.id}`}
                              type={field.type ?? 'text'}
                              placeholder={field.placeholder}
                              value={actionValues[preset.id]?.[field.id] ?? ''}
                              disabled={disabled}
                              onChange={(e) =>
                                setField(preset.id, field.id, e.target.value)
                              }
                            />
                          )}
                        </div>
                      ))}
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={disabled}
                      >
                        שליחה לעוזר
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>

          {actionMsg && <p className="assistant-action-error">{actionMsg}</p>}
        </details>
      </div>
    </details>
  );
}
