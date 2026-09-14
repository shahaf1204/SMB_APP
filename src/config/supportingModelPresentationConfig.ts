import type { RecommendableOperatingModel } from './businessTypeRecommendationConfig';
import { resolveEffectiveOperatingRecommendation } from './businessTypeRecommendationConfig';
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
 * Contextual supporting-model rules — independent from primary recommendation.
 * Primary recommendation lives on step 2 only (businessTypeRecommendationConfig).
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

function resolvePresetId(input: SupportingModelPromptInput): string | undefined {
  if (input.mode === 'custom' || input.presetId === '__other__') return undefined;
  return input.presetId;
}

/** Business-type recommended primary — must never be suggested as supporting. */
function resolveConfiguredRecommendedPrimary(
  input: SupportingModelPromptInput,
): RecommendableOperatingModel | undefined {
  const effective = resolveEffectiveOperatingRecommendation(
    input.mode,
    input.presetId,
    input.clarificationChoiceId,
  );
  if (effective.kind !== 'recommended') return undefined;
  return effective.recommendation.recommendedPrimary;
}

function matchingSupportingRules(input: SupportingModelPromptInput): SupportingModelPromptRule[] {
  if (input.primaryModel === 'hybrid') return [];

  const primary = input.primaryModel as RecommendableOperatingModel;
  const presetId = resolvePresetId(input);
  const configuredPrimary = resolveConfiguredRecommendedPrimary(input);
  const effective = resolveEffectiveOperatingRecommendation(
    input.mode,
    input.presetId,
    input.clarificationChoiceId,
  );

  return SUPPORTING_MODEL_PROMPT_RULES.filter((rule) => {
    if (rule.primaryOperatingModel !== primary) return false;
    if (rule.businessTypePresetId !== undefined && rule.businessTypePresetId !== presetId) {
      return false;
    }
    if (rule.targetModel === primary) return false;
    if (configuredPrimary && rule.targetModel === configuredPrimary) return false;

    if (rule.businessTypePresetId === undefined) {
      if (effective.kind !== 'recommended') return false;
      const rec = effective.recommendation;
      if (primary !== rec.recommendedPrimary) return false;
      if (!rec.recommendedAdditional?.includes(rule.targetModel)) return false;
    }

    return true;
  });
}

/**
 * Supporting models for step 3 — ONLY from contextual rules + selected primary.
 * Does NOT use businessTypeRecommendationConfig.recommendedAdditional.
 */
export function resolveRecommendedSupportingModels(
  input: SupportingModelPromptInput,
): RecommendableOperatingModel[] {
  const seen = new Set<RecommendableOperatingModel>();
  const models: RecommendableOperatingModel[] = [];

  for (const rule of matchingSupportingRules(input)) {
    if (seen.has(rule.targetModel)) continue;
    seen.add(rule.targetModel);
    models.push(rule.targetModel);
  }

  return models;
}

export function resolveSupportingModelPrompts(
  input: SupportingModelPromptInput,
): SupportingModelPrompt[] {
  const seen = new Set<RecommendableOperatingModel>();

  return matchingSupportingRules(input)
    .filter((rule) => {
      if (seen.has(rule.targetModel)) return false;
      seen.add(rule.targetModel);
      return true;
    })
    .map((rule) => ({
      targetModel: rule.targetModel,
      questionHe: rule.questionHe,
      valueExplanationHe: rule.valueExplanationHe,
      acceptLabelHe: rule.acceptLabelHe ?? DEFAULT_ACCEPT,
      declineLabelHe: rule.declineLabelHe ?? DEFAULT_DECLINE,
    }));
}

export function isContextuallyRecommendedSupportingModel(
  input: SupportingModelPromptInput,
  model: OperatingModel,
): boolean {
  if (model === 'hybrid') return false;
  return resolveRecommendedSupportingModels(input).includes(
    model as RecommendableOperatingModel,
  );
}

export function supportingModelHintHe(
  input: SupportingModelPromptInput,
  model: OperatingModel,
): string | undefined {
  if (model === 'hybrid') return undefined;
  const rule = matchingSupportingRules(input).find((r) => r.targetModel === model);
  return rule?.valueExplanationHe;
}

/** Whether step 3 should default to contextual questions (not full catalog). */
export function shouldUseContextualSupportingModelFlow(
  input: SupportingModelPromptInput,
): boolean {
  if (input.primaryModel === 'hybrid') return false;
  return resolveSupportingModelPrompts(input).length > 0;
}
