import { useState, useCallback } from 'react';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';

/**
 * Custom hook for clipboard operations
 *
 * Handles copy-to-clipboard with temporary state for UI feedback
 *
 * @param {Function} showToast - Toast notification function
 * @returns {Object} Clipboard functions and state
 */
export function useClipboard(showToast) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  /**
   * Copy text to clipboard with feedback
   * @param {string} text - Text to copy
   * @param {string|number} index - Unique identifier for tracking which item was copied
   */
  const copyToClipboard = useCallback(async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      showToast(SUCCESS_MESSAGES.COPIED);

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast(ERROR_MESSAGES.COPY_FAILED, 'error');
    }
  }, [showToast]);

  return { copiedIndex, copyToClipboard };
}
