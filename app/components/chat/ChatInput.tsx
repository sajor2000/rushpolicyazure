'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Loader2, X, Sparkles } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear?: () => void;
  isLoading: boolean;
  disabled?: boolean;
  maxLength?: number;
  showClear?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onClear,
  isLoading,
  disabled = false,
  maxLength = 2000,
  showClear = false,
  placeholder = 'Ask about HIPAA, PTO, policies...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const characterWarningThreshold = maxLength * 0.8; // 80% of max

  // Auto-expand textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading || disabled) return;
    onSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const isOverWarningThreshold = value.length >= characterWarningThreshold;
  const isNearLimit = value.length >= maxLength * 0.95;

  return (
    <div className="p-4 md:p-6 bg-gradient-to-r from-white to-sage/5">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Input Area with Enhanced Styling */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            maxLength={maxLength}
            className="min-h-[56px] md:min-h-[64px] max-h-[200px] resize-none pr-16 text-base border-growth/30 focus:border-growth focus:ring-growth/20 bg-white placeholder:text-rush-gray/50 shadow-sm"
            aria-label="Ask a policy question"
            aria-describedby={value.length > 0 ? 'char-count' : undefined}
          />

          {/* Floating Send Button - Mobile */}
          <div className="absolute right-2 bottom-2 md:hidden">
            <Button
              type="submit"
              size="icon"
              variant="rush-primary"
              disabled={isLoading || !value.trim() || disabled}
              className="h-10 w-10 rounded-full shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Desktop: Button Row + Character Counter */}
        <div className="hidden md:flex items-center justify-between">
          {/* Character Counter */}
          <div className="flex items-center space-x-4">
            {value.length > 0 && (
              <span
                id="char-count"
                className={`text-xs transition-colors ${
                  isNearLimit
                    ? 'text-red-600 font-bold'
                    : isOverWarningThreshold
                    ? 'text-gold font-semibold'
                    : 'text-rush-gray/60'
                }`}
                aria-live="polite"
                aria-label={`${value.length} of ${maxLength} characters`}
              >
                {value.length} / {maxLength}
              </span>
            )}

            {!value && (
              <p className="text-xs text-rush-gray/60 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-growth" />
                <span>
                  <kbd className="px-2 py-0.5 bg-sage/30 rounded text-legacy font-medium">Enter</kbd> to send,
                  <kbd className="ml-1.5 px-2 py-0.5 bg-sage/30 rounded text-legacy font-medium">Shift + Enter</kbd> for new line
                </span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {/* Clear Button */}
            {showClear && (
              <Button
                type="button"
                variant="rush-secondary"
                size="default"
                onClick={onClear}
                className="min-w-[100px]"
                aria-label="Clear conversation"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}

            {/* Send Button */}
            <Button
              type="submit"
              variant="rush-primary"
              size="default"
              disabled={isLoading || !value.trim() || disabled}
              className="min-w-[120px] shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile: Character Counter Only */}
        {value.length > 0 && (
          <div className="md:hidden flex justify-end">
            <span
              className={`text-xs transition-colors ${
                isNearLimit
                  ? 'text-red-600 font-bold'
                  : isOverWarningThreshold
                  ? 'text-gold font-semibold'
                  : 'text-rush-gray/60'
              }`}
            >
              {value.length} / {maxLength}
            </span>
          </div>
        )}

        {/* Mobile: Clear Button (separate row) */}
        {showClear && (
          <div className="md:hidden">
            <Button
              type="button"
              variant="rush-secondary"
              size="touch"
              onClick={onClear}
              className="w-full"
              aria-label="Clear conversation"
            >
              <X className="w-5 h-5 mr-2" />
              Clear Conversation
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
