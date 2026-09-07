import { ONBOARDING_BUSINESS_TYPE_PRESETS } from '../data/businessTypePresets';
import { OPERATING_MODEL_ADDITIONAL_OPTIONS } from './operatingModelConfig';
import type { OperatingModel } from '../types/workspace';

/** Concrete operating models — hybrid is never recommended in new onboarding. */
export type RecommendableOperatingModel = Exclude<OperatingModel, 'hybrid'>;

/**
 * Plain-language working-style labels for onboarding (not internal architecture terms).
 */
export const WORKING_STYLE_LABELS_HE: Record<RecommendableOperatingModel, string> = {
  event: 'אירועים ועבודות בתאריך',
  appointment: 'תורים ופגישות',
  package: 'כרטיסיות וחבילות',
  journey: 'ליווי ותהליכים',
  project: 'פרויקטים',
  recurring: 'פעילות קבועה וחוזרת',
};

/** Default contextual hints when an additional model is recommended. */
export const ADDITIONAL_MODEL_HINTS_HE: Partial<
  Record<RecommendableOperatingModel, string>
> = {
  package: 'מומלץ לעסקים שמוכרים סדרת מפגשים מראש',
  appointment: 'מתאים גם לפגישות בודדות לפי יומן',
  project: 'מתאים לעבודות עם שלבים, תוצרים ודדליין',
  event: 'מתאים גם להזמנות ועבודות לפי תאריך',
  journey: 'מתאים גם לליווי מתמשך לאורך זמן',
  recurring: 'מתאים גם לחוגים או מפגשים שחוזרים במחזוריות',
};

/** New-user alternative picker — primary + additional models only (no hybrid). */
export const NEW_USER_ONBOARDING_PICKER_OPTIONS = OPERATING_MODEL_ADDITIONAL_OPTIONS;

export interface BusinessTypeOperatingRecommendation {
  businessTypePresetId: string;
  recommendedPrimary: RecommendableOperatingModel;
  /** Short Hebrew explanation shown on the recommended card */
  explanationHe: string;
  recommendedAdditional?: RecommendableOperatingModel[];
  additionalHintsHe?: Partial<Record<RecommendableOperatingModel, string>>;
}

export interface ClarificationOptionRecommendation {
  recommendedPrimary: RecommendableOperatingModel;
  explanationHe: string;
  recommendedAdditional?: RecommendableOperatingModel[];
  additionalHintsHe?: Partial<Record<RecommendableOperatingModel, string>>;
}

export interface BusinessTypeClarificationOption {
  id: string;
  labelHe: string;
  recommendation: ClarificationOptionRecommendation;
}

export interface BusinessTypeClarification {
  businessTypePresetId: string;
  questionHe: string;
  options: BusinessTypeClarificationOption[];
}

export type BusinessTypeRecommendationPolicy =
  | { type: 'direct'; recommendation: BusinessTypeOperatingRecommendation }
  | { type: 'clarification'; clarification: BusinessTypeClarification };

export type BusinessTypeRecommendationResult =
  | { kind: 'recommended'; recommendation: BusinessTypeOperatingRecommendation }
  | { kind: 'clarification'; clarification: BusinessTypeClarification }
  | { kind: 'fallback' };

function rec(
  businessTypePresetId: string,
  recommendedPrimary: RecommendableOperatingModel,
  explanationHe: string,
  recommendedAdditional?: RecommendableOperatingModel[],
  additionalHintsHe?: Partial<Record<RecommendableOperatingModel, string>>,
): BusinessTypeOperatingRecommendation {
  return {
    businessTypePresetId,
    recommendedPrimary,
    explanationHe,
    recommendedAdditional,
    additionalHintsHe,
  };
}

/**
 * Central onboarding recommendation policies — direct OR guided clarification.
 * Custom / unknown types resolve to fallback (no guessed recommendation).
 */
export const BUSINESS_TYPE_RECOMMENDATION_POLICIES: Record<
  string,
  BusinessTypeRecommendationPolicy
> = {
  birthday: {
    type: 'direct',
    recommendation: rec(
      'birthday',
      'event',
      'מתאים לעסק שמארגן אירועים ועבודות לפי תאריך מוגדר.',
    ),
  },
  photographer: {
    type: 'direct',
    recommendation: rec(
      'photographer',
      'event',
      'מתאים לעסק שעובד בעיקר לפי תאריך צילום או אירוע.',
      ['project'],
      { project: 'מתאים לעבודות עם שלבים, אספקה ודדליין' },
    ),
  },
  therapist: {
    type: 'direct',
    recommendation: rec(
      'therapist',
      'journey',
      'מתאים לעסק שמלווה מטופלים בתהליך מתמשך לאורך זמן.',
      ['appointment'],
      { appointment: 'מתאים גם לפגישות בודדות לפי יומן' },
    ),
  },
  coach: {
    type: 'clarification',
    clarification: {
      businessTypePresetId: 'coach',
      questionHe: 'איך רוב העבודה שלך מתנהלת?',
      options: [
        {
          id: 'ongoing_coaching',
          labelHe: 'ליווי מתמשך של לקוחות',
          recommendation: {
            recommendedPrimary: 'journey',
            explanationHe: 'מתאים לעסק שמלווה מתאמנים בתהליך מתמשך עם מטרות ושלבים.',
            recommendedAdditional: ['appointment', 'package'],
            additionalHintsHe: {
              appointment: 'מתאים גם לפגישות בודדות לפי יומן',
            },
          },
        },
        {
          id: 'scheduled_sessions',
          labelHe: 'פגישות או אימונים שקובעים ביומן',
          recommendation: {
            recommendedPrimary: 'appointment',
            explanationHe: 'מתאים לעסק שמנהל אימונים ופגישות לפי תאריך ושעה.',
            recommendedAdditional: ['package'],
          },
        },
      ],
    },
  },
  consultant: {
    type: 'clarification',
    clarification: {
      businessTypePresetId: 'consultant',
      questionHe: 'איך רוב העבודה שלך מתנהלת?',
      options: [
        {
          id: 'ongoing_consulting',
          labelHe: 'ליווי מתמשך של לקוחות',
          recommendation: {
            recommendedPrimary: 'journey',
            explanationHe: 'מתאים לעסק שמלווה לקוחות בתהליך ייעוץ מתמשך.',
            recommendedAdditional: ['appointment'],
          },
        },
        {
          id: 'defined_projects',
          labelHe: 'עבודה על פרויקטים עם התחלה ותוצאה מוגדרת',
          recommendation: {
            recommendedPrimary: 'project',
            explanationHe: 'מתאים לעסק שמנהל פרויקטי ייעוץ עם שלבים ותוצרים.',
            recommendedAdditional: ['appointment'],
          },
        },
      ],
    },
  },
  tutor: {
    type: 'direct',
    recommendation: rec(
      'tutor',
      'appointment',
      'מתאים לעסק שמנהל שיעורים ופגישות לפי תאריך ושעה.',
      ['package'],
    ),
  },
  beauty: {
    type: 'direct',
    recommendation: rec(
      'beauty',
      'appointment',
      'מתאים לעסק שמנהל לקוחות לפי שעות ביומן.',
      ['package'],
    ),
  },
  studio: {
    type: 'direct',
    recommendation: rec(
      'studio',
      'recurring',
      'מתאים לעסק שמנהל חוגים או מפגשים קבועים במחזוריות.',
      ['appointment'],
      { appointment: 'מתאים גם לשיעורים פרטיים לפי יומן' },
    ),
  },
  design: {
    type: 'direct',
    recommendation: rec(
      'design',
      'event',
      'מתאים לעסק שעובד בעיקר לפי תאריך אירוע או הזמנה.',
      ['project'],
    ),
  },
  freelance: {
    type: 'clarification',
    clarification: {
      businessTypePresetId: 'freelance',
      questionHe: 'איך רוב העבודה שלך מתנהלת?',
      options: [
        {
          id: 'defined_deliverables',
          labelHe: 'עבודות או פרויקטים עם תוצאה מוגדרת',
          recommendation: {
            recommendedPrimary: 'project',
            explanationHe: 'מתאים לעסק שמנהל פרויקטים ושירותים מקצועיים עם לקוחות.',
            recommendedAdditional: ['appointment'],
          },
        },
        {
          id: 'scheduled_services',
          labelHe: 'פגישות או שירותים שקובעים ביומן',
          recommendation: {
            recommendedPrimary: 'appointment',
            explanationHe: 'מתאים לעסק שמנהל פגישות ושירותים לפי תאריך ושעה.',
            recommendedAdditional: ['project'],
          },
        },
      ],
    },
  },
  confectioner: {
    type: 'direct',
    recommendation: rec(
      'confectioner',
      'event',
      'מתאים לעסק שמקבל הזמנות ועובד לפי תאריך אספקה.',
    ),
  },
  balloons: {
    type: 'direct',
    recommendation: rec(
      'balloons',
      'event',
      'מתאים לעסק שמעצב ומספק לפי תאריך אירוע או הזמנה.',
    ),
  },
};

/** @deprecated Use BUSINESS_TYPE_RECOMMENDATION_POLICIES — kept for tests scanning direct entries */
export const BUSINESS_TYPE_OPERATING_RECOMMENDATIONS: Record<
  string,
  BusinessTypeOperatingRecommendation
> = Object.fromEntries(
  Object.entries(BUSINESS_TYPE_RECOMMENDATION_POLICIES)
    .filter(([, policy]) => policy.type === 'direct')
    .map(([id, policy]) => [
      id,
      (policy as { type: 'direct'; recommendation: BusinessTypeOperatingRecommendation })
        .recommendation,
    ]),
);

export function resolveBusinessTypeOperatingRecommendation(
  mode: 'list' | 'custom',
  presetId: string,
): BusinessTypeRecommendationResult {
  if (mode === 'custom' || presetId === '__other__') {
    return { kind: 'fallback' };
  }
  const policy = BUSINESS_TYPE_RECOMMENDATION_POLICIES[presetId];
  if (!policy) {
    return { kind: 'fallback' };
  }
  if (policy.type === 'direct') {
    return { kind: 'recommended', recommendation: policy.recommendation };
  }
  return { kind: 'clarification', clarification: policy.clarification };
}

export function buildRecommendationFromClarificationOption(
  clarification: BusinessTypeClarification,
  choiceId: string,
): BusinessTypeOperatingRecommendation | undefined {
  const option = clarification.options.find((o) => o.id === choiceId);
  if (!option) return undefined;
  return {
    businessTypePresetId: clarification.businessTypePresetId,
    ...option.recommendation,
  };
}

/** Resolved recommendation for direct presets or after clarification choice. */
export function resolveEffectiveOperatingRecommendation(
  mode: 'list' | 'custom',
  presetId: string,
  clarificationChoiceId?: string | null,
): BusinessTypeRecommendationResult {
  const resolved = resolveBusinessTypeOperatingRecommendation(mode, presetId);
  if (resolved.kind === 'clarification' && clarificationChoiceId) {
    const recommendation = buildRecommendationFromClarificationOption(
      resolved.clarification,
      clarificationChoiceId,
    );
    if (recommendation) {
      return { kind: 'recommended', recommendation };
    }
  }
  return resolved;
}

export function getAdditionalModelHintHe(
  recommendation: BusinessTypeOperatingRecommendation,
  model: RecommendableOperatingModel,
): string | undefined {
  return (
    recommendation.additionalHintsHe?.[model] ??
    ADDITIONAL_MODEL_HINTS_HE[model]
  );
}

export function isRecommendedAdditionalModel(
  recommendation: BusinessTypeOperatingRecommendation | undefined,
  model: OperatingModel,
): boolean {
  if (!recommendation || model === 'hybrid') return false;
  return recommendation.recommendedAdditional?.includes(model) ?? false;
}

export function isAmbiguousBusinessTypePreset(presetId: string): boolean {
  const policy = BUSINESS_TYPE_RECOMMENDATION_POLICIES[presetId];
  return policy?.type === 'clarification';
}

/** Ensures every onboarding preset has a policy entry (for tests / CI). */
export const ONBOARDING_PRESET_RECOMMENDATION_POLICY = ONBOARDING_BUSINESS_TYPE_PRESETS.map(
  (preset) => ({
    presetId: preset.id,
    hasPolicy: preset.id in BUSINESS_TYPE_RECOMMENDATION_POLICIES,
    isClarification: isAmbiguousBusinessTypePreset(preset.id),
  }),
);

/** Hybrid must not appear in new-user onboarding picker options. */
export function newUserPickerIncludesHybrid(): boolean {
  return NEW_USER_ONBOARDING_PICKER_OPTIONS.some((o) => o.id === 'hybrid');
}
