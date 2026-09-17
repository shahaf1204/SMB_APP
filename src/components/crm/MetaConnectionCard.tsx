import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MetaConnection } from '../../types/crm';
import type { MetaOAuthPageCandidate } from '../../types/metaOAuth.client';
import { disconnectMetaConnection } from '../../lib/crm/metaConnection';
import {
  clearStoredOAuthAttempt,
  formatLastLeadReceived,
  formatPageDisplayName,
  readStoredOAuthAttempt,
  resolveMetaConnectionUiPhase,
  writeStoredOAuthAttempt,
} from '../../lib/crm/metaConnectionUx';
import {
  fetchMetaOAuthPageCandidates,
  MetaOAuthClientError,
  startMetaOAuth,
  submitMetaOAuthPageSelection,
} from '../../lib/crm/metaOAuth.client';
import {
  mapMetaOAuthErrorToUserMessage,
  META_CONNECTION_COPY,
} from '../../lib/crm/metaOAuthUserMessages';

interface MetaConnectionCardProps {
  connection: MetaConnection | null;
  loading: boolean;
  businessId: string;
  onUpdated: () => void;
}

export function MetaConnectionCard({
  connection,
  loading,
  businessId,
  onUpdated,
}: MetaConnectionCardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSettings, setShowSettings] = useState(false);
  const [busy, setBusy] = useState(false);
  const [returningFromOAuth, setReturningFromOAuth] = useState(false);
  const [oauthAttemptId, setOauthAttemptId] = useState<string | null>(null);
  const [pageCandidates, setPageCandidates] = useState<MetaOAuthPageCandidate[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [userErrorCode, setUserErrorCode] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const pageSelectionActive = pageCandidates.length > 0 && Boolean(oauthAttemptId);

  const phase = useMemo(
    () =>
      resolveMetaConnectionUiPhase({
        connectionLoading: loading,
        connection,
        busy,
        returningFromOAuth,
        pageSelectionActive,
        showSuccessBanner,
        userErrorCode,
      }),
    [
      loading,
      connection,
      busy,
      returningFromOAuth,
      pageSelectionActive,
      showSuccessBanner,
      userErrorCode,
    ],
  );

  const clearOAuthQuery = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('meta_attempt');
    next.delete('meta_oauth_error');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadPageCandidates = useCallback(
    async (attemptId: string) => {
      setBusy(true);
      setReturningFromOAuth(true);
      setUserErrorCode(null);
      setUserMessage(null);
      try {
        const result = await fetchMetaOAuthPageCandidates(attemptId, businessId);
        setOauthAttemptId(result.attemptId);
        setPageCandidates(result.pages);
        setSelectedPageId(result.pages[0]?.pageId ?? '');
        writeStoredOAuthAttempt({ attemptId: result.attemptId, businessId });
      } catch (e) {
        const code = e instanceof MetaOAuthClientError ? e.code : 'attempt_load_failed';
        setUserErrorCode(code);
        setUserMessage(e instanceof Error ? e.message : mapMetaOAuthErrorToUserMessage(code));
        clearStoredOAuthAttempt();
      } finally {
        setBusy(false);
        setReturningFromOAuth(false);
      }
    },
    [businessId],
  );

  useEffect(() => {
    const oauthError = searchParams.get('meta_oauth_error');
    const attemptFromUrl = searchParams.get('meta_attempt');

    if (oauthError) {
      setUserErrorCode(oauthError);
      setUserMessage(mapMetaOAuthErrorToUserMessage(oauthError));
      clearStoredOAuthAttempt();
      clearOAuthQuery();
      return;
    }

    const attemptId = attemptFromUrl ?? readStoredOAuthAttempt(businessId)?.attemptId;
    if (!attemptId) return;

    if (attemptFromUrl) {
      writeStoredOAuthAttempt({ attemptId: attemptFromUrl, businessId });
      clearOAuthQuery();
    }

    void loadPageCandidates(attemptId);
  }, [businessId, clearOAuthQuery, loadPageCandidates, searchParams]);

  const handleConnect = async () => {
    if (busy) return;
    setBusy(true);
    setUserErrorCode(null);
    setUserMessage(null);
    setShowSuccessBanner(false);
    try {
      const url = await startMetaOAuth(businessId);
      setReturningFromOAuth(true);
      window.location.href = url;
    } catch (e) {
      const code = e instanceof MetaOAuthClientError ? e.code : 'oauth_start_failed';
      setUserErrorCode(code);
      setUserMessage(e instanceof Error ? e.message : mapMetaOAuthErrorToUserMessage(code));
      setBusy(false);
      setReturningFromOAuth(false);
    }
  };

  const handleOAuthPageSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!oauthAttemptId || !selectedPageId || busy) return;
    setBusy(true);
    setUserMessage(null);
    setUserErrorCode(null);
    try {
      await submitMetaOAuthPageSelection({
        attemptId: oauthAttemptId,
        pageId: selectedPageId,
        businessId,
      });
      setOauthAttemptId(null);
      setPageCandidates([]);
      clearStoredOAuthAttempt();
      setShowSuccessBanner(true);
      setUserMessage(null);
      await onUpdated();
    } catch (err) {
      const code = err instanceof MetaOAuthClientError ? err.code : 'page_selection_failed';
      setUserErrorCode(code);
      setUserMessage(err instanceof Error ? err.message : mapMetaOAuthErrorToUserMessage(code));
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection || busy) return;
    if (!window.confirm('לנתק את החיבור ל-Facebook ו-Instagram? לא ייכנסו לידים חדשים אוטומטית.')) {
      return;
    }
    setBusy(true);
    await disconnectMetaConnection(connection.id);
    setShowSettings(false);
    setShowSuccessBanner(false);
    setBusy(false);
    await onUpdated();
  };

  const dismissSuccess = () => setShowSuccessBanner(false);

  const lastLead = formatLastLeadReceived(connection?.lastLeadReceivedAt);

  if (phase === 'loading') {
    return (
      <section className="card crm-meta-card" aria-busy="true">
        <p className="crm-meta-title">{META_CONNECTION_COPY.title}</p>
        <p className="page-subtitle crm-meta-desc" style={{ margin: 0 }}>
          {META_CONNECTION_COPY.connecting}
        </p>
      </section>
    );
  }

  if (phase === 'page_selection') {
    return (
      <section className="card crm-meta-card" aria-labelledby="meta-page-select-title">
        <p className="crm-meta-title" id="meta-page-select-title">
          {META_CONNECTION_COPY.pageSelectTitle}
        </p>
        <p className="crm-meta-desc">{META_CONNECTION_COPY.pageSelectHint}</p>
        <form onSubmit={(e) => void handleOAuthPageSubmit(e)} className="crm-meta-form">
          <div className="crm-meta-page-list" role="radiogroup" aria-label={META_CONNECTION_COPY.pageSelectTitle}>
            {pageCandidates.map((page) => {
              const label = formatPageDisplayName(page);
              const selected = selectedPageId === page.pageId;
              return (
                <label
                  key={page.pageId}
                  className={`crm-meta-page-option${selected ? ' crm-meta-page-option--selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="meta-page-choice"
                    value={page.pageId}
                    checked={selected}
                    onChange={() => setSelectedPageId(page.pageId)}
                    disabled={busy}
                  />
                  <span className="crm-meta-page-option__name">{label}</span>
                </label>
              );
            })}
          </div>
          {userMessage && (
            <p className="crm-meta-error" role="alert">
              {userMessage}
            </p>
          )}
          <button type="submit" className="btn btn-primary crm-meta-cta" disabled={busy || !selectedPageId}>
            {busy ? META_CONNECTION_COPY.connecting : META_CONNECTION_COPY.pageSelectConfirm}
          </button>
        </form>
      </section>
    );
  }

  if (phase === 'connecting') {
    return (
      <section className="card crm-meta-card" aria-busy="true">
        <p className="crm-meta-title">{META_CONNECTION_COPY.title}</p>
        <p className="crm-meta-desc">
          {returningFromOAuth ? META_CONNECTION_COPY.loadingPages : META_CONNECTION_COPY.connecting}
        </p>
        <button type="button" className="btn btn-primary crm-meta-cta" disabled>
          {META_CONNECTION_COPY.connecting}
        </button>
      </section>
    );
  }

  if (phase === 'success') {
    return (
      <section className="card crm-meta-card crm-meta-card--connected" aria-live="polite">
        <p className="crm-meta-status-pill" aria-hidden="true">
          ✓
        </p>
        <p className="crm-meta-title">{META_CONNECTION_COPY.successTitle}</p>
        <p className="crm-meta-desc">{META_CONNECTION_COPY.successBody}</p>
        <button type="button" className="btn btn-primary crm-meta-cta" onClick={dismissSuccess}>
          המשך
        </button>
      </section>
    );
  }

  if (phase === 'connected') {
    return (
      <section className="card crm-meta-card crm-meta-card--connected">
        <p className="crm-meta-status-pill crm-meta-status-pill--connected" aria-hidden="true">
          מחובר
        </p>
        <p className="crm-meta-title">{META_CONNECTION_COPY.connectedTitle}</p>
        <p className="crm-meta-desc">{META_CONNECTION_COPY.connectedReady}</p>
        {connection?.pageName && (
          <p className="crm-meta-hint">
            עמוד מחובר: <strong>{connection.pageName}</strong>
          </p>
        )}
        <p className="crm-meta-desc crm-meta-desc--compact">{META_CONNECTION_COPY.afterConnectHint}</p>
        <button
          type="button"
          className="btn btn-ghost crm-meta-cta"
          onClick={() => setShowSettings((v) => !v)}
          aria-expanded={showSettings}
        >
          {META_CONNECTION_COPY.ctaSettings}
        </button>
        {showSettings && (
          <div className="crm-meta-form">
            <dl className="crm-meta-details">
              <div>
                <dt>סטטוס</dt>
                <dd>מחובר</dd>
              </div>
              {connection?.pageName && (
                <div>
                  <dt>עמוד</dt>
                  <dd>{connection.pageName}</dd>
                </div>
              )}
              {lastLead && (
                <div>
                  <dt>ליד אחרון שהתקבל</dt>
                  <dd>{lastLead}</dd>
                </div>
              )}
            </dl>
            <button
              type="button"
              className="btn btn-primary crm-meta-cta crm-meta-cta--spaced"
              disabled={busy}
              onClick={() => void handleConnect()}
            >
              {META_CONNECTION_COPY.ctaReconnect}
            </button>
            <button
              type="button"
              className="btn btn-ghost crm-meta-cta crm-meta-cta--destructive"
              disabled={busy}
              onClick={() => void handleDisconnect()}
            >
              ניתוק חיבור
            </button>
          </div>
        )}
      </section>
    );
  }

  if (phase === 'reconnect_required') {
    return (
      <section className="card crm-meta-card">
        <p className="crm-meta-title">{META_CONNECTION_COPY.reconnectRequiredTitle}</p>
        <p className="crm-meta-desc">{META_CONNECTION_COPY.reconnectRequiredBody}</p>
        {connection?.pageName && (
          <p className="crm-meta-hint">עמוד: {connection.pageName}</p>
        )}
        {userMessage && (
          <p className="crm-meta-error" role="alert">
            {userMessage}
          </p>
        )}
        <button
          type="button"
          className="btn btn-primary crm-meta-cta"
          disabled={busy}
          onClick={() => void handleConnect()}
        >
          {META_CONNECTION_COPY.ctaReconnect}
        </button>
      </section>
    );
  }

  if (phase === 'error') {
    const displayMsg = mapMetaOAuthErrorToUserMessage(
      userErrorCode ?? connection?.lastError ?? undefined,
    );
    return (
      <section className="card crm-meta-card">
        <p className="crm-meta-title">{META_CONNECTION_COPY.title}</p>
        <p className="crm-meta-error" role="alert">
          {displayMsg}
        </p>
        {connection?.pageName && !connection.isActive && (
          <p className="crm-meta-hint">עמוד: {connection.pageName}</p>
        )}
        <button
          type="button"
          className="btn btn-primary crm-meta-cta"
          disabled={busy}
          onClick={() => void handleConnect()}
        >
          {META_CONNECTION_COPY.ctaTryAgain}
        </button>
      </section>
    );
  }

  return (
    <section className="card crm-meta-card">
      <p className="crm-meta-title">{META_CONNECTION_COPY.title}</p>
      <p className="crm-meta-desc">{META_CONNECTION_COPY.benefit}</p>
      <p className="crm-meta-desc crm-meta-desc--compact">{META_CONNECTION_COPY.afterConnectHint}</p>
      <p className="crm-meta-desc crm-meta-desc--compact crm-meta-desc--muted">
        {META_CONNECTION_COPY.optionalNote}
      </p>
      {userMessage && (
        <p className="crm-meta-error" role="alert">
          {userMessage}
        </p>
      )}
      <button
        type="button"
        className="btn btn-primary crm-meta-cta"
        disabled={busy}
        onClick={() => void handleConnect()}
      >
        {META_CONNECTION_COPY.ctaConnect}
      </button>
    </section>
  );
}
