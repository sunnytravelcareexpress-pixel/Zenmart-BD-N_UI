import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {this.state.error?.message || 'An unexpected rendering error occurred. Please refresh or return to the store.'}
              </p>
            </div>

            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-left text-[11px] text-neutral-400 font-mono overflow-x-auto max-h-24">
              {this.state.error?.stack ? this.state.error.stack.split('\n').slice(0, 3).join('\n') : 'Error detected in React render phase'}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) {
                    this.props.onReset();
                  } else {
                    window.location.reload();
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) {
                    this.props.onReset();
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#D99A24] hover:bg-amber-400 text-neutral-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Storefront</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
