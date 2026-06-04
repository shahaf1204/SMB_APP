export type AiProviderId = 'none' | 'openai-compatible' | 'ollama' | 'gemini';

export interface AiSettings {
  enabled: boolean;
  provider: AiProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  createdAt: string;
  /** מוצג כשהעוזר מציע פעולה שדורשת אישור */
  pendingAction?: AssistantAction;
  actionDone?: boolean;
}

export type AssistantActionType =
  | 'add_task'
  | 'add_lead'
  | 'create_invoice'
  | 'add_event';

export interface AssistantAction {
  type: AssistantActionType;
  label: string;
  payload: Record<string, unknown>;
}
