/**
 * Custom Hook for Keyboard Shortcuts
 *
 * Handles keyboard shortcuts for accessibility and power users.
 * Supports Cmd/Ctrl+K for input focus and Escape to clear.
 */

import { useEffect } from 'react';

/**
 * Keyboard shortcuts hook
 * @param {React.RefObject} inputRef - Reference to the input element
 * @param {Function} onClear - Callback when clearing input (Escape key)
 */
export function useKeyboardShortcuts(inputRef, onClear) {
  useEffect(() => {
    const handleKeyboard = (e) => {
      // Cmd/Ctrl + K to focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Escape to clear input (only when input is focused)
      if (e.key === 'Escape' && inputRef.current === document.activeElement) {
        onClear();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [inputRef, onClear]);
}
