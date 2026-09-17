/** Client-safe Meta Page option after OAuth — no tokens. */
export interface MetaOAuthPageCandidate {
  pageId: string;
  pageName: string;
}

export interface MetaOAuthAttemptPagesResponse {
  attemptId: string;
  pages: MetaOAuthPageCandidate[];
}

export interface MetaOAuthSelectPageResponse {
  connectionId: string;
  pageId: string;
  pageName: string;
  connectionStatus: string;
  webhookSubscribedAt?: string;
}
