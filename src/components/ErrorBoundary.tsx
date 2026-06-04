import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearAppStorage } from '../lib/safeStorage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page" style={{ paddingTop: '2rem' }}>
          <h1 className="page-title">משהו השתבש</h1>
          <p className="page-subtitle">נסי לרענן את הדף. אם הבעיה נמשכת — נקי נתונים בדפדפן.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              רענון
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                clearAppStorage();
                window.location.reload();
              }}
            >
              איפוס נתונים ורענון
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
