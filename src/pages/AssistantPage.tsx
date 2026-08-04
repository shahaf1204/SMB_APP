import { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { AiSettingsForm } from '../components/AiSettingsForm';
import { AssistantPresetPanel } from '../components/AssistantPresetPanel';
import { BottomNav } from '../components/BottomNav';
import { buildAssistantContext } from '../lib/assistantContext';
import { getPastEventsForAssistant } from '../lib/assistantEvents';
import { executeAssistantAction } from '../lib/assistantActions';
import { isPaidAiReady, loadAiSettings } from '../lib/aiSettings';
import { createId } from '../lib/ids';
import { chatWithPaidAssistant } from '../lib/paidAssistant';
import { replyWithSmartAssistant } from '../lib/smartAssistant';
import { useAppStore } from '../store/useAppStore';
import type { ChatMessage } from '../types/ai';

function nowIso(): string {
  return new Date().toISOString();
}

export function AssistantPage() {
  const {
    business,
    events,
    eventValues,
    leads,
    invoices,
    tasks,
    dismissedAutoTasks,
    engagementSessions,
    engagements,
    monthlyExpenses,
    categories,
    user,
    addTask,
    addLead,
    createInvoice,
    addEvent,
  } = useAppStore(
    useShallow((s) => ({
      business: s.business,
      events: s.events,
      eventValues: s.eventValues,
      leads: s.leads,
      invoices: s.invoices,
      tasks: s.tasks,
      dismissedAutoTasks: s.dismissedAutoTasks,
      engagementSessions: s.engagementSessions,
      engagements: s.engagements,
      monthlyExpenses: s.monthlyExpenses,
      categories: s.categories,
      user: s.user,
      addTask: s.addTask,
      addLead: s.addLead,
      createInvoice: s.createInvoice,
      addEvent: s.addEvent,
    })),
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: createId(),
      role: 'assistant',
      text: 'שלום! פתחו את «שאלות ופעולות לעוזר» ובחרו מה הרשימה — כך אוכל לעזור בדיוק. פעולות דורשות «אישור» לפני ביצוע.',
      createdAt: nowIso(),
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiSettings, setAiSettings] = useState(() => loadAiSettings());
  const listRef = useRef<HTMLDivElement>(null);

  const ctx = useMemo(
    () =>
      buildAssistantContext({
        business,
        events,
        eventValues,
        leads,
        invoices,
        tasks,
        dismissedAutoTasks,
        engagementSessions,
        engagements,
        monthlyExpenses,
      }),
    [
      business,
      events,
      eventValues,
      leads,
      invoices,
      tasks,
      dismissedAutoTasks,
      engagementSessions,
      engagements,
      monthlyExpenses,
    ],
  );

  const pastEvents = useMemo(
    () => getPastEventsForAssistant(events, eventValues, categories),
    [events, eventValues, categories],
  );

  const paidReady = isPaidAiReady(aiSettings);
  const modeLabel = paidReady ? 'AI בתשלום (המפתח שלך)' : 'עוזר חינמי (מקומי)';

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  const appendMessage = (msg: Omit<ChatMessage, 'id' | 'createdAt'> & { id?: string }) => {
    setMessages((prev) => [
      ...prev,
      {
        id: msg.id ?? createId(),
        createdAt: nowIso(),
        role: msg.role,
        text: msg.text,
        pendingAction: msg.pendingAction,
        actionDone: msg.actionDone,
      },
    ]);
    scrollToEnd();
  };

  const actionStore = useMemo(
    () => ({
      business,
      user,
      categories,
      addTask,
      addLead,
      createInvoice,
      addEvent,
    }),
    [business, user, categories, addTask, addLead, createInvoice, addEvent],
  );

  const confirmAction = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.pendingAction || msg.actionDone) return;
    const result = executeAssistantAction(msg.pendingAction, actionStore);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, actionDone: true, text: `${m.text}\n\n✓ ${result.message}` }
          : m,
      ),
    );
    appendMessage({
      role: 'assistant',
      text: result.ok ? result.message : `לא בוצע: ${result.message}`,
    });
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy || !ctx) return;

    appendMessage({ role: 'user', text: trimmed });
    setInput('');
    setBusy(true);

    try {
      if (paidReady) {
        const history = messages
          .filter((m) => m.role === 'user' || (m.role === 'assistant' && !m.pendingAction))
          .slice(-12)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.text,
          }));

        const result = await chatWithPaidAssistant(
          aiSettings,
          history,
          trimmed,
          ctx,
        );

        if (!result.ok) {
          appendMessage({
            role: 'assistant',
            text: `${result.error}\n\nמנסים עם העוזר החינמי:`,
          });
          const fallback = replyWithSmartAssistant(trimmed, ctx);
          appendMessage({
            role: 'assistant',
            text: fallback.text,
            pendingAction: fallback.pendingAction,
          });
        } else {
          appendMessage({
            role: 'assistant',
            text: result.text,
            pendingAction: result.pendingAction,
          });
        }
      } else {
        const reply = replyWithSmartAssistant(trimmed, ctx);
        appendMessage({
          role: 'assistant',
          text: reply.text,
          pendingAction: reply.pendingAction,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  if (!ctx) {
    return (
      <div className="app-shell assistant-page">
        <div className="page">
          <h1 className="page-title">עוזר עסקי</h1>
          <p className="page-subtitle">יש להשלים הגדרת עסק לפני שימוש בעוזר.</p>
          <Link to="/onboarding" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>
            המשך הגדרה
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-shell assistant-page">
      <div className="page assistant-page-inner">
        <header className="assistant-header">
          <div>
            <h1 className="page-title" style={{ marginBottom: '0.15rem' }}>
              עוזר עסקי
            </h1>
            <span className={`assistant-mode-badge ${paidReady ? 'paid' : 'free'}`}>
              {modeLabel}
            </span>
          </div>
          <button
            type="button"
            className="chip"
            onClick={() => setShowSettings((v) => !v)}
          >
            {showSettings ? 'סגור הגדרות' : 'חיבור AI'}
          </button>
        </header>

        {showSettings && (
          <section className="card assistant-settings-card">
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>עוזר AI בתשלום (BYOK)</h2>
            <AiSettingsForm
              onSaved={() => setAiSettings(loadAiSettings())}
              compact
            />
          </section>
        )}

        <AssistantPresetPanel
          disabled={busy}
          pastEvents={pastEvents}
          onSend={(prompt) => void sendMessage(prompt)}
        />

        <div className="assistant-chat card" ref={listRef}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`assistant-bubble ${m.role === 'user' ? 'user' : 'bot'}`}
            >
              <p className="assistant-bubble-text">{m.text}</p>
              {m.pendingAction && !m.actionDone && (
                <div className="assistant-action-row">
                  <span className="assistant-action-label">{m.pendingAction.label}</span>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => confirmAction(m.id)}
                  >
                    אישור
                  </button>
                </div>
              )}
            </div>
          ))}
          {busy && (
            <p className="assistant-typing" aria-live="polite">
              חושב…
            </p>
          )}
        </div>

        <form className="assistant-input-row" onSubmit={handleSubmit}>
          <input
            type="text"
            className="assistant-input"
            placeholder="אופציונלי: טקסט חופשי…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            aria-label="הודעה לעוזר"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !input.trim()}
          >
            שלח
          </button>
        </form>

        <p className="field-hint assistant-footer-hint">
          העוזר החינמי לא שולח נתונים לענן. AI בתשלום משתמש במפתח שלכם —{' '}
          <Link to="/settings">גם בהגדרות</Link>.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
