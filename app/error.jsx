'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Global Error Boundary for Rush Policy Assistant
 *
 * This component catches and displays errors that occur during rendering,
 * providing a graceful fallback UI with recovery options.
 *
 * Next.js 14 App Router Convention: app/error.jsx
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Application Error:', error);

    // TODO: Send error to monitoring service (Application Insights, Sentry, etc.)
    // Example: trackException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sage/20 to-vitality/10 p-4">
      <div className="max-w-2xl w-full">
        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-rush-gray/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-legacy to-growth p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Something Went Wrong</h1>
                <p className="text-white/90 text-sm mt-1">
                  We encountered an unexpected error
                </p>
              </div>
            </div>
          </div>

          {/* Error Details */}
          <div className="p-6 space-y-4">
            <div className="bg-sage/10 border-l-4 border-growth rounded-lg p-4">
              <h2 className="font-semibold text-legacy mb-2">What happened?</h2>
              <p className="text-rush-black text-sm leading-relaxed">
                The Rush Policy Assistant encountered an error while processing your request.
                This has been logged and our team will investigate.
              </p>
            </div>

            {/* Error Message (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="bg-rush-gray/5 rounded-lg p-4 border border-rush-gray/20">
                <summary className="cursor-pointer text-sm font-semibold text-legacy mb-2">
                  Technical Details (Development Only)
                </summary>
                <pre className="mt-3 text-xs text-rush-black/80 overflow-x-auto bg-white p-3 rounded border border-rush-gray/20 font-mono">
                  {error.message || 'Unknown error'}
                  {error.stack && '\n\n' + error.stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={reset}
                className="flex-1 btn-primary"
                aria-label="Try again"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Try Again</span>
              </button>

              <a
                href="/"
                className="flex-1 btn-secondary"
                aria-label="Return to home page"
              >
                <Home className="w-5 h-5" />
                <span>Go Home</span>
              </a>
            </div>

            {/* Help Text */}
            <div className="pt-4 border-t border-rush-gray/20">
              <p className="text-xs text-rush-black/60 text-center">
                If this problem persists, please contact{' '}
                <a
                  href="mailto:support@rush.edu"
                  className="text-growth hover:text-legacy underline"
                >
                  IT Support
                </a>
                {' '}for assistance.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-sage/20 px-6 py-4 border-t border-rush-gray/10">
            <div className="flex items-center justify-between text-xs text-rush-black/60">
              <span>Rush University System for Health</span>
              <span>Policy Assistant v1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
