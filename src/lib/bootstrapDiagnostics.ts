const PHASE_KEY = 'smb-bootstrap-phase';
const OUTCOME_KEY = 'smb-bootstrap-outcome';
const AT_KEY = 'smb-bootstrap-at';

/** Non-destructive bootstrap diagnostics (no secrets, no snapshot payloads). */
export function setBootstrapPhase(phase: string): void {
  try {
    sessionStorage.setItem(PHASE_KEY, phase);
    sessionStorage.setItem(AT_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

export function recordBootstrapOutcome(outcome: string): void {
  try {
    sessionStorage.setItem(OUTCOME_KEY, outcome);
    sessionStorage.setItem(AT_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

export function readBootstrapDiagnostics(): {
  phase: string | null;
  outcome: string | null;
  at: string | null;
} {
  try {
    return {
      phase: sessionStorage.getItem(PHASE_KEY),
      outcome: sessionStorage.getItem(OUTCOME_KEY),
      at: sessionStorage.getItem(AT_KEY),
    };
  } catch {
    return { phase: null, outcome: null, at: null };
  }
}
