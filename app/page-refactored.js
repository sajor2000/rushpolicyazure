/**
 * Rush Policy Assistant - Main Chat Interface (Refactored)
 *
 * This is the refactored version with improved code organization:
 * - Extracted components for better reusability
 * - Custom hooks for state management
 * - Service layer for API calls
 * - Utility functions for document formatting
 *
 * Azure GPT-5 Chat Model with Managed Identity authentication
 */

'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, Loader2, Sparkles, FileText } from 'lucide-react';

// Custom Hooks
import { useToast } from './hooks/useToast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Components
import Toast from './components/Toast';
import MessageBubble from './components/MessageBubble';
import SuggestedPrompts from './components/SuggestedPrompts';

// Services
import { sendPolicyQuestion } from './services/policyService';

/**
 * Main Chat Interface Component
 */
export default function Home() {
  // State Management
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Custom Hooks
  const { toast, showToast } = useToast();

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard shortcuts (Cmd/Ctrl+K to focus, Escape to clear)
  useKeyboardShortcuts(inputRef, () => setInputValue(''));

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @param {number} index - Message index
   */
  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      showToast('Copied to clipboard!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  /**
   * Send message to the policy assistant
   * @param {Event} e - Form submit event
   * @param {string} promptText - Optional pre-filled prompt text
   */
  const sendMessage = async (e, promptText = null) => {
    if (e) e.preventDefault();

    const messageToSend = promptText || inputValue;
    if (!messageToSend.trim() || isLoading) return;

    setInputValue('');
    setMessages((prev) => [
      ...prev,
      { type: 'user', content: messageToSend, timestamp: new Date() },
    ]);
    setIsLoading(true);

    try {
      const data = await sendPolicyQuestion(messageToSend, messages.length === 0);

      setMessages((prev) => [
        ...prev,
        { type: 'bot', content: data.response, timestamp: new Date() },
      ]);
      showToast('Response received!');
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage =
        error?.message ||
        "I apologize, but I'm having trouble connecting to the PolicyTech database. Please try again or contact IT support if the issue persists.";

      setMessages((prev) => [
        ...prev,
        { type: 'error', content: errorMessage, timestamp: new Date() },
      ]);
      showToast('Error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear conversation
   */
  const handleClear = () => {
    setMessages([]);
    setInputValue('');
    showToast('Conversation cleared');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-sage/10">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <header className="bg-white border-b border-rush-gray/20 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-[110px] h-9">
                <Image
                  src="/images/rush-logo.jpg"
                  alt="Rush University System for Health"
                  fill
                  sizes="110px"
                  priority
                  className="object-contain"
                />
              </div>
              <div className="h-8 w-px bg-rush-gray/30"></div>
              <h1 className="text-xl font-semibold text-legacy">Policy Chat</h1>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-sage/30 rounded-full border border-growth/20">
              <div className="w-2 h-2 bg-growth rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-legacy">Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-rush-gray/20 h-full max-h-[750px] flex flex-col">
          {/* Chat Header */}
          <div className="border-b border-rush-gray/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-legacy">Ask your policy question</h2>
                <p className="text-sm text-rush-black/70 mt-1">
                  Get answers from 1300+ PolicyTech documents
                </p>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-vitality/10 rounded-lg border border-vitality/30">
                <Sparkles className="w-4 h-4 text-growth" />
                <span className="text-xs font-medium text-legacy">GPT-5 Chat</span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <SuggestedPrompts onPromptClick={(text) => sendMessage(null, text)} />
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  message={message}
                  index={index}
                  isCopied={copiedIndex === index}
                  onCopy={copyToClipboard}
                />
              ))
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-growth to-legacy rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border border-vitality/40">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-sage/40 px-6 py-4 rounded-2xl shadow-md border border-growth/30">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <div
                          className="w-2.5 h-2.5 bg-growth rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        ></div>
                        <div
                          className="w-2.5 h-2.5 bg-vitality rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        ></div>
                        <div
                          className="w-2.5 h-2.5 bg-legacy rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        ></div>
                      </div>
                      <span className="text-sm text-legacy font-semibold voice-invested">
                        Searching policies...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-rush-gray/20 p-6 bg-white">
            <form onSubmit={sendMessage} className="flex space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a policy question..."
                className="flex-1 border border-rush-gray/30 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-growth focus:border-growth transition-all bg-white text-rush-black placeholder-rush-gray/60"
                disabled={isLoading}
                aria-label="Ask a policy question"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6"
                aria-label="Send message"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="ml-2">Sending</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="ml-2">Send</span>
                  </>
                )}
              </button>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn-secondary px-4"
                  aria-label="Clear conversation"
                >
                  Clear
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-rush-black/60 border-t border-rush-gray/20">
        <div className="max-w-6xl mx-auto px-6">
          <p>Rush University System for Health • Internal Use Only • Powered by Azure GPT-5 Chat Model</p>
        </div>
      </footer>

      {/* Animations */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
