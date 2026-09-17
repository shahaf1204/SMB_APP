import { describe, expect, it } from 'vitest';
import type { MetaConnection } from '../../types/crm';
import {
  assertUserVisibleTextSafe,
  buildPageSelectionLabels,
  connectionStatusLabel,
  formatPageDisplayName,
  isMetaConnectionActionLocked,
  resolveMetaConnectionUiPhase,
  shouldOfferExplicitPageConfirmation,
} from './metaConnectionUx';
import { mapMetaOAuthErrorToUserMessage } from './metaOAuthUserMessages';

const baseConnection = (over: Partial<MetaConnection>): MetaConnection => ({
  id: '1',
  ownerId: 'u',
  businessId: 'b',
  pageId: 'secret-page-id-999',
  pageName: 'העסק שלי',
  isActive: true,
  connectionStatus: 'connected',
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('resolveMetaConnectionUiPhase', () => {
  it('A. disconnected', () => {
    expect(
      resolveMetaConnectionUiPhase({
        connectionLoading: false,
        connection: null,
        busy: false,
        returningFromOAuth: false,
        pageSelectionActive: false,
        showSuccessBanner: false,
        userErrorCode: null,
      }),
    ).toBe('not_connected');
  });

  it('B. connecting', () => {
    expect(
      resolveMetaConnectionUiPhase({
        connectionLoading: false,
        connection: null,
        busy: true,
        returningFromOAuth: false,
        pageSelectionActive: false,
        showSuccessBanner: false,
        userErrorCode: null,
      }),
    ).toBe('connecting');
  });

  it('success banner phase', () => {
    expect(
      resolveMetaConnectionUiPhase({
        connectionLoading: false,
        connection: baseConnection({}),
        busy: false,
        returningFromOAuth: false,
        pageSelectionActive: false,
        showSuccessBanner: true,
        userErrorCode: null,
      }),
    ).toBe('success');
  });

  it('C. page selection', () => {
    expect(
      resolveMetaConnectionUiPhase({
        connectionLoading: false,
        connection: null,
        busy: false,
        returningFromOAuth: false,
        pageSelectionActive: true,
        showSuccessBanner: false,
        userErrorCode: null,
      }),
    ).toBe('page_selection');
  });

  it('D. connected', () => {
    expect(
      resolveMetaConnectionUiPhase({
        connectionLoading: false,
        connection: baseConnection({}),
        busy: false,
        returningFromOAuth: false,
        pageSelectionActive: false,
        showSuccessBanner: false,
        userErrorCode: null,
      }),
    ).toBe('connected');
  });

  it('E. reconnect_required', () => {
    expect(
      resolveMetaConnectionUiPhase({
        connectionLoading: false,
        connection: baseConnection({ connectionStatus: 'reconnect_required', isActive: false }),
        busy: false,
        returningFromOAuth: false,
        pageSelectionActive: false,
        showSuccessBanner: false,
        userErrorCode: null,
      }),
    ).toBe('reconnect_required');
  });

  it('F/G. error mapping hides raw codes', () => {
    const msg = mapMetaOAuthErrorToUserMessage('page_already_connected');
    expect(msg).toContain('עסק אחר');
    expect(assertUserVisibleTextSafe(msg)).toBe(true);
    const unknown = mapMetaOAuthErrorToUserMessage('some_internal_graph_failure_xyz');
    expect(unknown).not.toMatch(/graph/i);
  });

  it('H/I. cancellation and expired recovery messages', () => {
    expect(mapMetaOAuthErrorToUserMessage('user_cancelled')).toMatch(/בוטל/);
    expect(mapMetaOAuthErrorToUserMessage('attempt_expired')).toMatch(/פג/);
  });

  it('M. page display labels exclude page id (id may exist as selection value)', () => {
    const labels = buildPageSelectionLabels([
      { pageId: '1234567890123', pageName: 'קפה בתל אביב' },
    ]);
    expect(labels[0]).toBe('קפה בתל אביב');
    expect(labels.join(' ')).not.toContain('1234567890123');
    expect(formatPageDisplayName({ pageId: 'x', pageName: 'שם' })).toBe('שם');
  });

  it('N/O. explicit confirmation for single and multiple pages', () => {
    expect(shouldOfferExplicitPageConfirmation(1)).toBe(true);
    expect(shouldOfferExplicitPageConfirmation(3)).toBe(true);
    const multi = buildPageSelectionLabels([
      { pageId: 'a', pageName: 'עמוד א' },
      { pageId: 'b', pageName: 'עמוד ב' },
    ]);
    expect(multi).toHaveLength(2);
    expect(multi.join(' ')).not.toContain('pageId');
  });

  it('K. duplicate action lock while busy', () => {
    expect(isMetaConnectionActionLocked(true)).toBe(true);
    expect(isMetaConnectionActionLocked(false)).toBe(false);
  });

  it('L. connected page name in labels only', () => {
    const name = formatPageDisplayName({ pageId: '999', pageName: 'קפה רוטשילד' });
    expect(name).toBe('קפה רוטשילד');
  });

  it('Q. existing connected business compatibility', () => {
    const legacy = baseConnection({
      connectionStatus: 'connected',
      isActive: true,
      pageName: 'Legacy Page',
    });
    expect(
      resolveMetaConnectionUiPhase({
        connectionLoading: false,
        connection: legacy,
        busy: false,
        returningFromOAuth: false,
        pageSelectionActive: false,
        showSuccessBanner: false,
        userErrorCode: null,
      }),
    ).toBe('connected');
    expect(connectionStatusLabel('connected')).toBe('מחובר');
  });

  it('R. optional — null connection is not_connected', () => {
    expect(
      resolveMetaConnectionUiPhase({
        connectionLoading: false,
        connection: null,
        busy: false,
        returningFromOAuth: false,
        pageSelectionActive: false,
        showSuccessBanner: false,
        userErrorCode: null,
      }),
    ).toBe('not_connected');
  });
});

describe('security — user visible strings', () => {
  it('never marks token-like sample as safe', () => {
    expect(assertUserVisibleTextSafe('access_token=EAAFAKE123')).toBe(false);
    expect(assertUserVisibleTextSafe('שם עמוד יפה')).toBe(true);
  });
});
