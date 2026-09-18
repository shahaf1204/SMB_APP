import type { ExternalFormConnection, ExternalFormSubmissionMode } from '../../types/externalForms';

/**
 * Temporary legacy compatibility only.
 * Do NOT expose in UI or assign to new connections — use `lead_first`.
 */
export const LEGACY_AUTO_EVENT_MODE = 'auto_event' as const satisfies ExternalFormSubmissionMode;

/**
 * Resolve how submissions for a connection are processed.
 * Safe fallback is always `lead_first` unless the persisted value is exactly `auto_event`.
 */
export function connectionSubmissionMode(
  connection: ExternalFormConnection,
): ExternalFormSubmissionMode {
  if (connection.submissionMode === LEGACY_AUTO_EVENT_MODE) {
    return LEGACY_AUTO_EVENT_MODE;
  }
  return 'lead_first';
}

export function isLeadFirstExternalForm(connection: ExternalFormConnection): boolean {
  return connectionSubmissionMode(connection) === 'lead_first';
}

export function isLegacyAutoEventExternalForm(connection: ExternalFormConnection): boolean {
  return connectionSubmissionMode(connection) === LEGACY_AUTO_EVENT_MODE;
}

/** Default mode for newly created connections (explicit, not inferred). */
export const DEFAULT_EXTERNAL_FORM_SUBMISSION_MODE = 'lead_first' as const;
