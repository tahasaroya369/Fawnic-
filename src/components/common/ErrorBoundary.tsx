import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full py-12 px-4 text-center bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl my-4">
          <div className="max-w-md mx-auto space-y-3">
            <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
              Content temporarily unavailable
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Please refresh or check back in a moment while our atelier catalog finishes updating.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
