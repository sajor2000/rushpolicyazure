'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-sage/20">
      <div className="max-w-md p-8 bg-white rounded-2xl shadow-xl border-2 border-blush">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 mb-6 bg-blush rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h2 className="text-2xl font-bold text-legacy mb-4 font-sans">
            Something went wrong
          </h2>

          <p className="text-rush-black mb-6 font-sans leading-relaxed">
            {error.message || 'An unexpected error occurred while processing your request. The Rush Policy Chat Assistant encountered an issue.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => reset()}
              className="w-full px-6 py-3 bg-legacy hover:bg-growth text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-growth focus:ring-offset-2"
              aria-label="Try again"
            >
              Try again
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-white hover:bg-sage/20 text-legacy font-semibold rounded-lg border-2 border-legacy transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-legacy focus:ring-offset-2"
              aria-label="Return to home page"
            >
              Return to Home
            </button>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-sm text-rush-gray font-sans">
            If this problem persists, please contact IT support.
          </p>
        </div>
      </div>
    </div>
  );
}
