import type { RecommendableOperatingModel } from './businessTypeRecommendationConfig';
import {
  isRecommendedAdditionalModel,
  resolveEffectiveOperatingRecommendation,
} from './businessTypeRecommendationConfig';
import type { OperatingModel } from '../types/workspace';

export interface SupportingModelPrompt {
  targetModel: RecommendableOperatingModel;
  questionHe: string;
  valueExplanationHe: string;
  acceptLabelHe: string;
  declineLabelHe: string;
}

interface SupportingModelPromptRule {
  businessTypePresetId?: string;
  primaryOperatingModel: RecommendableOperatingModel;
  targetModel: RecommendableOperatingModel;
  questionHe: string;
  valueExplanationHe: string;
  acceptLabelHe?: string;
  declineLabelHe?: string;
}

/**
 * Contextual supporting-model prompts — Business Type + Primary Model.
 * Only shown when aligned with effective operating recommendation.
 */
const SUPPORTING_MODEL_PROMPT_RULES: SupportingModelPromptRule[] = [
  {
    businessTypePresetId: 'tutor',
    primaryOperatingModel: 'appointment',
    targetModel: 'package',
    questionHe: 'את גם מוכרת חבילות שיעורים?',
    valueExplanationHe: 'נוכל לעקוב אחרי כמה שיעורים נוצלו וכמה נשארו.',
  },
  {
    businessTypePresetId: 'beauty',
    primaryOperatingModel: 'appointment',
    targetModel: 'package',
    questionHe: 'את מציעה גם סדרות או חבילות טיפולים?',
    valueExplanationHe: 'נוכל לעקוב אחרי ניצול החבילה ותוקף.',
  },
  {
    businessTypePresetId: 'photographer',
    primaryOperatingModel: 'event',
    targetModel: 'project',
    questionHe: 'חלק מהעבודות שלך ממשיכות לאורך כמה שלבים?',
    valueExplanationHe: 'נוכל להוסיף מעקב פרויקטלי לצד האירועים.',
  },
  {
    businessTypePresetId: 'design',
    primaryOperatingModel: 'event',
    targetModel: 'project',
    questionHe: 'יש גם עבודות שמתנהלות לאורך כמה שלבים?',
    valueExplanationHe: 'נוכל להוסיף מעקב פרויקטלי לצד העבודות לפי תאריך.',
  },
  {
    businessTypePresetId: 'studio',
    primaryOperatingModel: 'recurring',
    targetModel: 'appointment',
    questionHe: 'יש גם שיעורים פרטיים לפי יומן?',
    valueExplanationHe: 'נוכל לנהל גם פגישות בודדות לצד החוגים.',
  },
  {
    businessTypePresetId: 'therapist',
    primaryOperatingModel: 'journey',
    targetModel: 'appointment',
    questionHe: 'יש גם פגישות בודדות לפי יומן?',
    valueExplanationHe: 'נוכל לנהל גם תורים לצד התהליכים המתמשכים.',
  },
  {
    primaryOperatingModel: 'journey',
    targetModel: 'package',
    questionHe: 'את גם מוכרת חבילות מפגשים?',
    valueExplanationHe: 'נוכל לעקוב אחרי ניצול חבילות ותוקף.',
  },
  {
    primaryOperatingModel: 'journey',
    targetModel: 'appointment',
    questionHe: 'יש גם פגישות בודדות לפי יומן?',
    valueExplanationHe: 'נוכל לנהל גם תורים לצד התהליכים המתמשכים.',
  },
  {
    primaryOperatingModel: 'appointment',
    targetModel: 'package',
    questionHe: 'את גם מוכרת חבילות או כרטיסיות?',
    valueExplanationHe: 'נוכל לעקוב אחרי כמה מפגשים נוצלו וכמה נשארו.',
  },
  {
    primaryOperatingModel: 'project',
    targetModel: 'appointment',
    questionHe: 'יש גם פגישות או ייעוצים לפי יומן?',
    valueExplanationHe: 'נוכל לנהל גם תורים לצד הפרויקטים.',
  },
  {
    primaryOperatingModel: 'event',
    targetModel: 'project',
    questionHe: 'חלק מהעבודות שלך ממשיכות לאורך כמה שלבים?',
    valueExplanationHe: 'נוכל להוסיף מעקב פרויקטלי לצד האירועים.',
  },
];

const DEFAULT_ACCEPT = 'כן, להוסיף';
const DEFAULT_DECLINE = 'לא עכשיו';

export interface SupportingModelPromptInput {
  mode: 'list' | 'custom';
  presetId: string;
  clarificationChoiceId?: string;
  primaryModel: OperatingModel;
}

export function resolveSupportingModelPrompts(
  input: SupportingModelPromptInput,
): SupportingModelPrompt[] {
  if (input.primaryModel === 'hybrid') return [];

  const primary = input.primaryModel as RecommendableOperatingModel;
  const presetId =
    input.mode === 'custom' || input.presetId === '__other__'
      ? undefined
      : input.presetId;

  const effective = resolveEffectiveOperatingRecommendation(
    input.mode,
    input.presetId,
    input.clarificationChoiceId,
  );
  if (effective.kind !== 'recommended') return [];

  const recommendation = effective.recommendation;

  const candidates = SUPPORTING_MODEL_PROMPT_RULES.filter(
    (rule) =>
      rule.primaryOperatingModel === primary &&
      (rule.businessTypePresetId === undefined || rule.businessTypePresetId === presetId),
  );

  const seen = new Set<RecommendableOperatingModel>();
  const prompts: SupportingModelPrompt[] = [];

  for (const rule of candidates) {
    if (seen.has(rule.targetModel)) continue;
    if (!isRecommendedAdditionalModel(recommendation, rule.targetModel)) {
      continue;
    }
    seen.add(rule.targetModel);
    prompts.push({
      targetModel: rule.targetModel,
      questionHe: rule.questionHe,
      valueExplanationHe: rule.valueExplanationHe,
      acceptLabelHe: rule.acceptLabelHe ?? DEFAULT_ACCEPT,
      declineLabelHe: rule.declineLabelHe ?? DEFAULT_DECLINE,
    });
  }

  return prompts;
}

/** Whether step 3 should default to contextual questions (not full catalog). */
export function shouldUseContextualSupportingModelFlow(
  input: SupportingModelPromptInput,
): boolean {
  if (input.primaryModel === 'hybrid') return false;
  return resolveSupportingModelPrompts(input).length > 0;
}
