import React from 'react';
import logger from '../../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error using our centralized logger
    logger.error('Uncaught React Error', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white p-6">
          <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl p-8 border border-red-500/30">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
            <p className="text-slate-400 mb-6">
              An unexpected error occurred in the dashboard. Our team has been notified.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-all"
            >
              Refresh Dashboard
            </button>
            <details className="mt-6 text-xs text-slate-500 cursor-pointer">
              <summary>View Technical Details</summary>
              <pre className="mt-2 p-3 bg-black rounded overflow-auto max-h-40">
                {this.state.error && this.state.error.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
