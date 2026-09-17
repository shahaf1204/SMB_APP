import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MetaConnection } from '../../types/crm';
import type { MetaOAuthPageCandidate } from '../../types/metaOAuth.client';
import {
  disconnectMetaConnection,
  getMetaWebhookUrl,
  saveMetaConnectionPending,
} from '../../lib/crm/metaConnection';
import {
  fetchMetaOAuthPageCandidates,
  startMetaOAuth,
  submitMetaOAuthPageSelection,
} from '../../lib/crm/metaOAuth.client';

interface MetaConnectionCardProps {
  connection: MetaConnection | null;
  loading: boolean;
  userId: string;
  businessId: string;
  onUpdated: () => void;
}

export function MetaConnectionCard({
  connection,
  loading,
  userId,
  businessId,
  onUpdated,
}: MetaConnectionCardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showManage, setShowManage] = useState(false);
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthAttemptId, setOauthAttemptId] = useState<string | null>(null);
  const [pageCandidates, setPageCandidates] = useState<MetaOAuthPageCandidate[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');

  const webhookUrl = getMetaWebhookUrl();
  const isConnected = Boolean(connection?.isActive && connection.connectionStatus === 'connected');

  const clearOAuthQuery = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('meta_attempt');
    next.delete('meta_oauth_error');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const attempt = searchParams.get('meta_attempt');
    const oauthError = searchParams.get('meta_oauth_error');
    if (oauthError) {
      setMsg(`חיבור Meta: ${oauthError}`);
      clearOAuthQuery();
      return;
    }
    if (!attempt) return;

    setBusy(true);
    void fetchMetaOAuthPageCandidates(attempt, businessId)
      .then((result) => {
        setOauthAttemptId(result.attemptId);
        setPageCandidates(result.pages);
        setSelectedPageId(result.pages[0]?.pageId ?? '');
        setMsg('בחרו עמוד Meta להשלמת החיבור.');
      })
      .catch((e: unknown) => {
        setMsg(e instanceof Error ? e.message : 'טעינת עמודים נכשלה');
      })
      .finally(() => {
        setBusy(false);
        clearOAuthQuery();
      });
  }, [businessId, clearOAuthQuery, searchParams]);

  const handleConnect = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const url = await startMetaOAuth(businessId);
      window.location.href = url;
    } catch {
      setShowManage(true);
      setMsg('OAuth שרת לא זמין — אפשר להזין Page ID ידנית (מצב בדיקות).');
      setBusy(false);
    }
  };

  const handleOAuthPageSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!oauthAttemptId || !selectedPageId) return;
    setBusy(true);
    setMsg(null);
    try {
      await submitMetaOAuthPageSelection({
        attemptId: oauthAttemptId,
        pageId: selectedPageId,
        businessId,
      });
      setOauthAttemptId(null);
      setPageCandidates([]);
      setMsg('Meta מחובר — לידים יגיעו דרך Webhook.');
      onUpdated();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'בחירת עמוד נכשלה');
    } finally {
      setBusy(false);
    }
  };

  const handleSavePending = async (e: FormEvent) => {
    e.preventDefault();
    if (!pageId.trim() || !pageName.trim()) {
      setMsg('יש למלא מזהה עמוד ושם עמוד');
      return;
    }
    setBusy(true);
    setMsg(null);
    const saved = await saveMetaConnectionPending(userId, businessId, pageId, pageName);
    setBusy(false);
    if (!saved) {
      setMsg('לא הצלחנו לשמור — ודא/י ש-Supabase CRM מוגדר (supabase/crm.sql)');
      return;
    }
    setMsg('העמוד נשמר. השלימ/י הגדרת Webhook ב-Meta Developer Console.');
    setShowManage(false);
    onUpdated();
  };

  const handleDisconnect = async () => {
    if (!connection || !window.confirm('לנתק את חיבור Meta?')) return;
    setBusy(true);
    await disconnectMetaConnection(connection.id);
    setBusy(false);
    onUpdated();
  };

  if (loading) {
    return (
      <section className="card crm-meta-card">
        <p className="crm-meta-title">חיבור Meta</p>
        <p className="page-subtitle" style={{ margin: 0 }}>
          טוען…
        </p>
      </section>
    );
  }

  if (pageCandidates.length > 0 && oauthAttemptId) {
    return (
      <section className="card crm-meta-card">
        <p className="crm-meta-title">בחירת עמוד Meta</p>
        <form onSubmit={(e) => void handleOAuthPageSubmit(e)} className="crm-meta-form">
          <div className="field">
            <label htmlFor="meta-oauth-page">עמוד</label>
            <select
              id="meta-oauth-page"
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
            >
              {pageCandidates.map((p) => (
                <option key={p.pageId} value={p.pageId}>
                  {p.pageName} ({p.pageId})
                </option>
              ))}
            </select>
          </div>
          {msg && <p className="crm-meta-msg">{msg}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'מחבר…' : 'השלמת חיבור'}
          </button>
        </form>
      </section>
    );
  }

  if (!isConnected) {
    return (
      <section className="card crm-meta-card">
        <p className="crm-meta-title">Meta Lead Ads (מתקדם)</p>
        <p className="crm-meta-desc">
          חיבור אוטומטי מפייסבוק ואינסטגרם — OAuth מאובטח דרך השרת.
        </p>
        {connection && !connection.isActive && (
          <p className="crm-meta-hint">
            עמוד «{connection.pageName}» — סטטוס: {connection.connectionStatus}
            {connection.lastError ? ` (${connection.lastError})` : ''}
          </p>
        )}
        {msg && <p className="crm-meta-msg">{msg}</p>}
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={busy}
          onClick={() => void handleConnect()}
        >
          {busy ? 'פותח…' : 'חיבור Meta'}
        </button>
        {showManage && (
          <form onSubmit={(e) => void handleSavePending(e)} className="crm-meta-form">
            <div className="field">
              <label htmlFor="meta-page-id">מזהה עמוד (Page ID)</label>
              <input
                id="meta-page-id"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder="123456789"
              />
            </div>
            <div className="field">
              <label htmlFor="meta-page-name">שם העמוד</label>
              <input
                id="meta-page-name"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                placeholder="שם העסק בפייסבוק"
              />
            </div>
            <p className="crm-meta-webhook">
              Webhook URL:
              <br />
              <code>{webhookUrl}</code>
            </p>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'שומר…' : 'שמירת עמוד (ידני)'}
            </button>
          </form>
        )}
      </section>
    );
  }

  return (
    <section className="card crm-meta-card crm-meta-card--connected">
      <p className="crm-meta-title">מחובר ל-Meta</p>
      <p className="crm-meta-desc">
        {connection?.pageName
          ? `עמוד: ${connection.pageName}`
          : 'לידים חדשים ייכנסו אוטומטית מהטפסים הפעילים שלך.'}
      </p>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ width: '100%' }}
        onClick={() => setShowManage((v) => !v)}
      >
        ניהול חיבור
      </button>
      {showManage && (
        <div className="crm-meta-form">
          <p className="crm-meta-webhook">
            Webhook: <code>{webhookUrl}</code>
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: 8 }}
            disabled={busy}
            onClick={() => void handleConnect()}
          >
            חיבור מחדש
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', color: 'var(--color-error)' }}
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
