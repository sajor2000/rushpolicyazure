import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { PERFORMANCE } from '../../constants';

/**
 * ChatInput Component
 *
 * Handles user input for policy questions with:
 * - Character counter
 * - Submit/Clear actions
 * - Keyboard shortcuts (Enter to submit)
 * - Loading state
 *
 * @param {Object} props
 * @param {string} props.inputValue - Current input value
 * @param {Function} props.setInputValue - Input value setter
 * @param {Function} props.sendMessage - Message send handler
 * @param {Function} props.handleClear - Clear conversation handler
 * @param {boolean} props.isLoading - Loading state
 * @param {number} props.messageCount - Number of messages (for conditional clear button)
 * @param {React.RefObject} props.inputRef - Input element ref
 */
export default function ChatInput({
  inputValue,
  setInputValue,
  sendMessage,
  handleClear,
  isLoading,
  messageCount,
  inputRef
}) {
  const characterCount = inputValue.length;
  const isNearLimit = characterCount >= PERFORMANCE.CHARACTER_WARNING_THRESHOLD;
  const isOverLimit = characterCount > PERFORMANCE.MAX_MESSAGE_LENGTH;

  return (
    <div className="border-t border-rush-gray/20 px-6 py-4 bg-gradient-to-b from-white to-sage/5">
      <form onSubmit={sendMessage} className="space-y-2">
        {/* Input Row */}
        <div className="flex space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            placeholder="Ask about HIPAA, PTO, remote work policies..."
            className="flex-1 border border-rush-gray/30 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-growth focus:border-growth transition-all bg-white text-rush-black placeholder-rush-gray/60"
            disabled={isLoading}
            aria-label="Ask a policy question"
            maxLength={PERFORMANCE.MAX_MESSAGE_LENGTH}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6"
            aria-label="Send message"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="ml-2">Searching...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span className="ml-2">Send</span>
              </>
            )}
          </button>

          {/* Clear Button (conditional) */}
          {messageCount > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="btn-secondary px-4"
              aria-label="Clear conversation"
            >
              Clear
            </button>
          )}
        </div>

        {/* Character Counter */}
        {characterCount > 0 && (
          <div className="flex justify-end px-1">
            <span
              className={`text-xs transition-colors ${
                isNearLimit
                  ? 'text-red-600 font-semibold'
                  : 'text-rush-gray/60'
              }`}
              aria-live="polite"
              aria-label={`${characterCount} of ${PERFORMANCE.MAX_MESSAGE_LENGTH} characters`}
            >
              {characterCount} / {PERFORMANCE.MAX_MESSAGE_LENGTH}
              {isOverLimit && ' - Too long!'}
            </span>
          </div>
        )}

        {/* Keyboard Hint */}
        <div className="flex justify-between px-1 text-xs text-rush-gray/50">
          <span>⌘K to focus • Escape to clear</span>
          <span>Enter to send</span>
        </div>
      </form>
    </div>
  );
}
