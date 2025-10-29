import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for managing toast notifications using Sonner
 *
 * Provides a simple API for showing toast notifications
 * with different types (success, error, info)
 *
 * @returns {Object} Toast control functions
 */
export function useToast() {
  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {'success'|'error'|'info'} type - Toast type
   */
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'info':
        toast.info(message);
        break;
      default:
        toast(message);
    }
  }, []);

  return { showToast };
}
