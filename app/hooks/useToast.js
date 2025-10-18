/**
 * Custom Hook for Toast Notifications
 *
 * Manages toast notification state and automatic dismissal
 * with accessibility support.
 */

import { useState, useCallback } from 'react';

const DEFAULT_TOAST_DURATION = 3000; // 3 seconds

/**
 * Toast notification hook
 * @param {number} duration - Toast display duration in milliseconds
 * @returns {Object} Toast state and control functions
 */
export function useToast(duration = DEFAULT_TOAST_DURATION) {
  const [toast, setToast] = useState(null);

  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {string} type - Toast type ('success' or 'error')
   */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, [duration]);

  /**
   * Manually dismiss the current toast
   */
  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    dismissToast,
  };
}
