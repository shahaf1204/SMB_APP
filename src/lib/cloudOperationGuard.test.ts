import { describe, expect, it } from 'vitest';
import {
  abandonPushToken,
  beginHydration,
  beginPush,
  canApplyHydration,
  canExecutePush,
  invalidateCloudOperations,
  resetCloudOperationGuardsForTests,
} from './cloudOperationGuard.js';

describe('cloudOperationGuard', () => {
  it('blocks hydration after generation bump', () => {
    resetCloudOperationGuardsForTests();
    const token = beginHydration('user-a');
    expect(canApplyHydration(token, null, true)).toBe(true);
    invalidateCloudOperations();
    expect(canApplyHydration(token, 'user-a', true)).toBe(false);
  });

  it('blocks push after timeout abandon', () => {
    resetCloudOperationGuardsForTests();
    const token = beginPush('user-a');
    expect(canExecutePush(token, 'user-a')).toBe(true);
    abandonPushToken(token);
    expect(canExecutePush(token, 'user-a')).toBe(false);
  });

  it('blocks push for wrong active user', () => {
    resetCloudOperationGuardsForTests();
    const token = beginPush('user-a');
    expect(canExecutePush(token, 'user-b')).toBe(false);
  });

  it('blocks hydration for wrong active user', () => {
    resetCloudOperationGuardsForTests();
    const token = beginHydration('user-a');
    expect(canApplyHydration(token, 'user-b', true)).toBe(false);
  });
});
