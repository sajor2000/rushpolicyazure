import { useState, useCallback, useRef, useEffect } from 'react';
import { PERFORMANCE } from '../constants';

/**
 * Custom hook for managing toast notifications
 *
 * Provides auto-dismiss functionality with configurable duration
 *
 * @returns {Object} Toast state and control functions
 */
export function useToast() {
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {'success'|'error'|'info'} type - Toast type
   */
  const showToast = useCallback((message, type = 'success') => {
    // Clear existing timeout to prevent race conditions
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ message, type });

    // Auto-dismiss after configured duration
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, PERFORMANCE.TOAST_DURATION);
  }, []);

  /**
   * Manually hide the toast
   */
  const hideToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToast(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return { toast, showToast, hideToast };
}
