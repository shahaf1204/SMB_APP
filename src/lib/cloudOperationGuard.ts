/**
 * Guards against stale cloud I/O completing after timeouts, logout, or account switch.
 * Does not abort fetch — only prevents applying outdated results.
 */

let hydrationGeneration = 0;
let pushGeneration = 0;

export type OperationToken = { generation: number; userId: string };

export function beginHydration(userId: string): OperationToken {
  hydrationGeneration += 1;
  return { generation: hydrationGeneration, userId };
}

export function beginPush(userId: string): OperationToken {
  pushGeneration += 1;
  return { generation: pushGeneration, userId };
}

/** Invalidate in-flight hydration/push results (logout, account switch, auth bootstrap timeout). */
export function invalidateCloudOperations(): void {
  hydrationGeneration += 1;
  pushGeneration += 1;
}

/** Drop a timed-out push so a late upsert cannot overwrite newer cloud data. */
export function abandonPushToken(token: OperationToken): void {
  if (token.generation === pushGeneration) {
    pushGeneration += 1;
  }
}

export function canApplyHydration(
  token: OperationToken,
  activeUserId: string | null,
  allowUnsetUser = false,
): boolean {
  if (token.generation !== hydrationGeneration) return false;
  if (!activeUserId) return allowUnsetUser;
  return activeUserId === token.userId;
}

export function canExecutePush(token: OperationToken, activeUserId: string | null): boolean {
  if (token.generation !== pushGeneration) return false;
  if (!activeUserId) return false;
  return activeUserId === token.userId;
}

/** Test-only */
export function resetCloudOperationGuardsForTests(): void {
  hydrationGeneration = 0;
  pushGeneration = 0;
}
