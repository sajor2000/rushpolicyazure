import React from 'react';
import { CheckCheck, AlertCircle } from 'lucide-react';

/**
 * Toast Notification Component
 *
 * Displays temporary success or error notifications with auto-dismiss
 * Accessible with ARIA live regions
 */
export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-out ${
        toast.type === 'success'
          ? 'bg-growth text-white'
          : 'bg-blush border-2 border-red-500 text-red-700'
      } animate-slide-in-right`}
    >
      <div className="flex items-center space-x-2">
        {toast.type === 'success' ? (
          <CheckCheck className="w-5 h-5" aria-hidden="true" />
        ) : (
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
        )}
        <span className="font-medium">{toast.message}</span>
      </div>
    </div>
  );
}
