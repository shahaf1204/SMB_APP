import type { AiProviderId, AiSettings } from '../types/ai';

const STORAGE_KEY = 'smb-ai-settings';

const DEFAULTS: AiSettings = {
  enabled: false,
  provider: 'none',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
};

export const AI_PROVIDER_LABELS: Record<AiProviderId, string> = {
  none: 'ללא חיבור',
  'openai-compatible': 'OpenAI / תואם OpenAI',
  ollama: 'Ollama (מקומי)',
  gemini: 'Google Gemini',
};

export function defaultBaseUrl(provider: AiProviderId): string {
  switch (provider) {
    case 'ollama':
      return 'http://localhost:11434/v1';
    case 'gemini':
      return 'https://generativelanguage.googleapis.com/v1beta';
    case 'openai-compatible':
      return 'https://api.openai.com/v1';
    default:
      return DEFAULTS.baseUrl;
  }
}

export function defaultModel(provider: AiProviderId): string {
  switch (provider) {
    case 'ollama':
      return 'llama3.2';
    case 'gemini':
      return 'gemini-2.0-flash';
    case 'openai-compatible':
      return 'gpt-4o-mini';
    default:
      return DEFAULTS.model;
  }
}

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    return {
      ...DEFAULTS,
      ...parsed,
      provider: (parsed.provider as AiProviderId) ?? 'none',
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveAiSettings(settings: AiSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function isPaidAiReady(settings: AiSettings): boolean {
  if (!settings.enabled || settings.provider === 'none') return false;
  if (settings.provider === 'ollama') return Boolean(settings.model.trim());
  return Boolean(settings.apiKey.trim() && settings.model.trim());
}
