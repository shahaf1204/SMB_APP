import type { AiSettings } from '../types/ai';
import type { AssistantAction } from '../types/ai';
import { contextToPromptText, type AssistantContextSnapshot } from './assistantContext';

export interface PaidChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type PaidAssistantResult =
  | { ok: true; text: string; pendingAction?: AssistantAction }
  | { ok: false; error: string };

const TOOLS_OPENAI = [
  {
    type: 'function' as const,
    function: {
      name: 'add_task',
      description: 'הוספת משימה לרשימת היום',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          dueDate: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_lead',
      description: 'הוספת ליד חדש',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_invoice',
      description: 'יצירת חשבונית טיוטה',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string' },
          amount: { type: 'number' },
          eventId: { type: 'string', description: 'מזהה אירוע לקישור' },
          notes: { type: 'string' },
        },
        required: ['clientName', 'amount'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_event',
      description: 'הוספת אירוע ליומן',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          eventDate: { type: 'string', description: 'YYYY-MM-DD' },
          revenue: { type: 'number' },
          location: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['title', 'eventDate'],
      },
    },
  },
];

function toolToAction(name: string, args: Record<string, unknown>): AssistantAction | null {
  switch (name) {
    case 'add_task':
      return {
        type: 'add_task',
        label: `משימה: ${String(args.title)}`,
        payload: args,
      };
    case 'add_lead':
      return {
        type: 'add_lead',
        label: `ליד: ${String(args.name)}`,
        payload: args,
      };
    case 'create_invoice':
      return {
        type: 'create_invoice',
        label: `חשבונית: ${String(args.clientName)}`,
        payload: args,
      };
    case 'add_event':
      return {
        type: 'add_event',
        label: `אירוע: ${String(args.title)}`,
        payload: args,
      };
    default:
      return null;
  }
}

const SYSTEM_PROMPT = `אתה עוזר עסקי בעברית לאפליקציית ניהול לעסקים קטנים.
ענה בקצרה ובבהירות. כשהמשתמש מבקש לבצע פעולה במערכת — השתמש בכלים המתאימים.
אל תמציא נתונים שלא בסיכום העסק. תאריכים בפורמט YYYY-MM-DD.`;

async function chatOpenAiCompatible(
  settings: AiSettings,
  messages: PaidChatMessage[],
  ctx: AssistantContextSnapshot,
): Promise<PaidAssistantResult> {
  const base = settings.baseUrl.replace(/\/$/, '');
  const url = `${base}/chat/completions`;
  const body = {
    model: settings.model,
    messages: [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\nנתוני העסק:\n${contextToPromptText(ctx)}`,
      },
      ...messages.filter((m) => m.role !== 'system'),
    ],
    tools: TOOLS_OPENAI,
    tool_choice: 'auto',
  };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.apiKey.trim()) {
    headers.Authorization = `Bearer ${settings.apiKey.trim()}`;
  }

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return {
      ok: false,
      error: parseApiError(res.status, errText, settings.provider),
    };
  }

  const data = (await res.json()) as {
    choices?: {
      message?: {
        content?: string | null;
        tool_calls?: { function: { name: string; arguments: string } }[];
      };
    }[];
  };

  const msg = data.choices?.[0]?.message;
  if (!msg) return { ok: false, error: 'תשובה ריקה מהמודל.' };

  if (msg.tool_calls?.length) {
    const tc = msg.tool_calls[0];
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
    } catch {
      return { ok: false, error: 'המודל החזיר פעולה לא תקינה.' };
    }
    const action = toolToAction(tc.function.name, args);
    if (!action) return { ok: false, error: 'פעולה לא נתמכת מהמודל.' };
    return {
      ok: true,
      text: 'המודל מציע לבצע פעולה — אשרו לפני ביצוע:',
      pendingAction: action,
    };
  }

  return { ok: true, text: msg.content?.trim() || '(ללא תשובה)' };
}

async function chatGemini(
  settings: AiSettings,
  messages: PaidChatMessage[],
  ctx: AssistantContextSnapshot,
): Promise<PaidAssistantResult> {
  const model = settings.model.trim();
  const key = settings.apiKey.trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const contents = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body = {
    systemInstruction: {
      parts: [
        {
          text: `${SYSTEM_PROMPT}\n\nנתוני העסק:\n${contextToPromptText(ctx)}`,
        },
      ],
    },
    contents,
    tools: [
      {
        functionDeclarations: TOOLS_OPENAI.map((t) => ({
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters,
        })),
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return { ok: false, error: parseApiError(res.status, errText, 'gemini') };
  }

  const data = (await res.json()) as {
    candidates?: {
      content?: {
        parts?: { text?: string; functionCall?: { name: string; args: Record<string, unknown> } }[];
      };
    }[];
  };

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    if (p.functionCall) {
      const action = toolToAction(p.functionCall.name, p.functionCall.args ?? {});
      if (!action) return { ok: false, error: 'פעולה לא נתמכת.' };
      return {
        ok: true,
        text: 'המודל מציע לבצע פעולה — אשרו לפני ביצוע:',
        pendingAction: action,
      };
    }
  }

  const text = parts.map((p) => p.text).filter(Boolean).join('\n').trim();
  return { ok: true, text: text || '(ללא תשובה)' };
}

function parseApiError(status: number, body: string, provider: string): string {
  if (status === 0) {
    return 'לא ניתן להתחבר לשרת ה-AI (רשת או CORS). ל-OpenAI השתמשו בפרוקסי או ב-Ollama מקומי.';
  }
  if (status === 401 || status === 403) {
    return 'מפתח API לא תקין או חסר הרשאה.';
  }
  if (status === 404) {
    return `כתובת או מודל לא נמצאו (${provider}). בדקו base URL ושם מודל.`;
  }
  try {
    const j = JSON.parse(body) as { error?: { message?: string } };
    if (j.error?.message) return j.error.message;
  } catch {
    /* ignore */
  }
  return `שגיאת שרת (${status}).`;
}

export async function chatWithPaidAssistant(
  settings: AiSettings,
  history: PaidChatMessage[],
  userMessage: string,
  ctx: AssistantContextSnapshot,
): Promise<PaidAssistantResult> {
  const messages: PaidChatMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
  ];

  try {
    if (settings.provider === 'gemini') {
      return await chatGemini(settings, messages, ctx);
    }
    return await chatOpenAiCompatible(settings, messages, ctx);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/failed to fetch|network|cors/i.test(msg)) {
      return {
        ok: false,
        error:
          'חיבור נחסם (לרוב CORS בדפדפן). נסו Ollama מקומי, LM Studio, או שרת תואם OpenAI עם CORS מופעל.',
      };
    }
    return { ok: false, error: msg };
  }
}
