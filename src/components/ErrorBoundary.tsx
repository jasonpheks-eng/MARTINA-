import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error?.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(readable);
      if (parsed && typeof parsed.error === 'string') {
        readable = `Database sync notice (${parsed.operationType || 'operation'} on ${parsed.path || 'cloud'}): ${parsed.error}`;
      }
    } catch {
      // Plain error message
    }
    return {
      hasError: true,
      message: readable,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#3d111e] text-[#efeee9] flex items-center justify-center p-6 font-hn">
          <div className="max-w-md w-full rounded-2xl bg-[#1a1a1a] border border-white/15 p-6 sm:p-8 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto">
              <AlertTriangle size={22} />
            </div>
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-white">
              Something Interrupted Studio Sync
            </h2>
            <p className="text-xs text-white/70 leading-relaxed break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-full bg-[#ebd2d8] text-[#3d111e] hover:bg-[#efeee9] text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reload Studio</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
