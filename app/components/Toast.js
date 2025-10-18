/**
 * Toast Notification Component
 *
 * Displays temporary notification messages with accessibility support.
 * Automatically positioned at top-right with slide-in animation.
 */

import React from 'react';
import { CheckCheck, AlertCircle } from 'lucide-react';

/**
 * Toast notification component
 * @param {Object} props - Component props
 * @param {string} props.message - Message to display
 * @param {string} props.type - Toast type ('success' or 'error')
 * @param {Function} props.onDismiss - Optional callback when toast is dismissed
 * @returns {React.Element|null} Toast component or null if no message
 */
export default function Toast({ message, type = 'success', onDismiss }) {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-out ${
        isSuccess
          ? 'bg-growth text-white'
          : 'bg-blush border-2 border-red-500 text-red-700'
      } animate-slide-in-right`}
    >
      <div className="flex items-center space-x-2">
        {isSuccess ? (
          <CheckCheck className="w-5 h-5" aria-hidden="true" />
        ) : (
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
        )}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}
