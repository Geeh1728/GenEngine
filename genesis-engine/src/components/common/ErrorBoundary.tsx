'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * A robust Error Boundary to catch React rendering errors (especially in R3F/Three.js)
 * and display a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.componentName || 'Component'} crashed:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full w-full min-h-[200px] bg-red-950/20 border border-red-500/30 rounded-xl p-6 text-center backdrop-blur-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-white mb-2">
            {this.props.componentName ? `${this.props.componentName} Failed` : 'System Malfunction'}
          </h3>
          <p className="text-xs text-red-200/70 font-mono mb-6 max-w-md break-words">
            {this.state.error?.message || 'An unexpected error occurred in the simulation layer.'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors text-xs font-bold uppercase tracking-widest border border-red-500/50"
          >
            <RefreshCcw className="w-3 h-3" />
            Reboot Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
