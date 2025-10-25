'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FileText, Sparkles, Shield, Users, Clock, Send, Loader2 } from 'lucide-react';
import { PERFORMANCE, ERROR_MESSAGES, SUCCESS_MESSAGES, API_ENDPOINTS } from './constants';

// Components
import Toast from './components/chat/Toast';
import MessageItem from './components/chat/MessageItem';

// Custom Hooks
import { useToast } from './hooks/useToast';
import { useClipboard } from './hooks/useClipboard';

// Utility Functions
import { parseResponse } from './utils/policyParser';
import { parseMetadataHeader, formatDocumentContent } from './utils/documentFormatter';

// Timestamp-based key generation for stable, unique React keys
function generateKey(message, index) {
  const timestamp = message.timestamp?.getTime() || Date.now();
  return `msg-${timestamp}-${index}`;
}

/**
 * Rush Policy Assistant - Azure GPT-5 Chat Model
 *
 * This application uses Azure GPT-5 Chat Model (latest generation) via Azure AI Agent
 * with Managed Identity authentication (zero API keys required).
 *
 * Rush University System for Health - Official Brand Color Palette
 *
 * Primary Colors:
 * - Legacy: #006332 (Primary green - represents heritage and trust)
 * - Growth: #30AE6E (Vibrant green - represents progress)
 * - Vitality: #5FEEA2 (Bright green - represents energy)
 * - Sage: #DFF9EB (Soft green - represents calm and care)
 *
 * Accent Colors:
 * - Gold: #FFC60B (Optimism and excellence)
 * - Sky Blue: #54ADD3 (Innovation and clarity)
 * - Navy: #005D83 (Trust and professionalism)
 * - Purple: #2D1D4E (Wisdom and dignity)
 * - Violet: #6C43B9 (Creativity and vision)
 * - Blush: #FFE3E0 (Warmth and compassion)
 * - Sand: #F2DBB3 (Comfort and accessibility)
 *
 * Neutrals:
 * - Rush Black: #5F5858 (Primary text)
 * - Rush Gray: #AFAEAF (Secondary text)
 *
 * Brand Voice: Inclusive, Invested, Inventive, Accessible
 */

const SUGGESTED_PROMPTS = [
  { icon: Shield, text: "What are our HIPAA privacy requirements?", category: "Compliance & Privacy" },
  { icon: FileText, text: "Show me the infection control policy", category: "Clinical Guidance" },
  { icon: Users, text: "Can I work remotely?", category: "Workforce & HR" },
  { icon: Clock, text: "How does PTO accrual work?", category: "Time & Benefits" },
];

// Memoized suggested prompts component to prevent unnecessary re-renders
const SuggestedPromptsGrid = React.memo(({ onPromptClick }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {SUGGESTED_PROMPTS.map((prompt, index) => (
      <button
        key={`prompt-${index}-${prompt.text.substring(0, 20)}`}
        onClick={() => onPromptClick(prompt.text)}
        className="p-4 bg-white border border-rush-gray/30 rounded-lg hover:border-growth hover:bg-sage/10 transition-all text-left"
      >
        <div className="flex items-center space-x-3">
          <prompt.icon className="w-5 h-5 text-growth flex-shrink-0" />
          <span className="text-sm text-rush-black">{prompt.text}</span>
        </div>
      </button>
    ))}
  </div>
));

SuggestedPromptsGrid.displayName = 'SuggestedPromptsGrid';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Use custom hooks for toast and clipboard functionality
  const { toast, showToast } = useToast();
  const { copiedIndex, copyToClipboard } = useClipboard(showToast);

  const scrollToBottom = useCallback(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    // Only auto-scroll if user is near bottom (within SCROLL_THRESHOLD pixels)
    const container = messagesContainerRef.current;
    const shouldScroll = !container ||
      (container.scrollHeight - container.scrollTop - container.clientHeight < PERFORMANCE.SCROLL_THRESHOLD);

    if (shouldScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: scrollBehavior });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e) => {
      // Cmd/Ctrl + K to focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to clear input
      if (e.key === 'Escape' && inputRef.current === document.activeElement) {
        setInputValue('');
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized sendMessage to prevent stale closures in child components
  const sendMessage = useCallback(async (e, promptText = null) => {
    if (e) e.preventDefault();
    const messageToSend = promptText || inputValue;

    // Sanitize control characters that might break parsing FIRST
    const sanitizedMessage = messageToSend
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .trim();

    // Input validation AFTER sanitization
    if (!sanitizedMessage || isLoading) return;

    // Character limit validation
    if (sanitizedMessage.length > PERFORMANCE.MAX_MESSAGE_LENGTH) {
      showToast(ERROR_MESSAGES.MESSAGE_TOO_LONG(PERFORMANCE.MAX_MESSAGE_LENGTH), 'error');
      return;
    }

    setInputValue('');

    // Add user message with animation
    setMessages(prev => [...prev, { type: 'user', content: sanitizedMessage, timestamp: new Date() }]);
    setIsLoading(true);

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(API_ENDPOINTS.AZURE_AGENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: sanitizedMessage
          // Note: Backend always creates fresh thread (stateless architecture)
          // No resetConversation flag needed - every request is fresh
        }),
        signal: abortControllerRef.current.signal
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
      }

      if (!response.ok) {
        throw new Error(data.details || data.error || `HTTP error! status: ${response.status}`);
      }

      // Add bot response
      setMessages(prev => [...prev, { type: 'bot', content: data.response, timestamp: new Date() }]);
      showToast(SUCCESS_MESSAGES.RESPONSE_RECEIVED);
    } catch (error) {
      // Handle aborted requests silently
      if (error.name === 'AbortError') {
        console.log('Request was cancelled by user sending new message');
        return;
      }

      console.error("Error sending message:", error);
      const messageText = typeof error === 'string' ? error : error?.message;
      let errorMessage = messageText || ERROR_MESSAGES.CONNECTION_FAILED;

      setMessages(prev => [...prev, {
        type: 'error',
        content: errorMessage,
        timestamp: new Date()
      }]);
      showToast('Error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, showToast]); // Dependencies: inputValue, isLoading, showToast

  // Memoized callback for suggested prompts to prevent unnecessary re-renders
  const handlePromptClick = useCallback((promptText) => {
    sendMessage(null, promptText);
  }, [sendMessage]); // ✅ Fixed: Added sendMessage dependency

  const handleClear = async () => {
    setInputValue('');
    setMessages([]);
    try {
      await fetch(API_ENDPOINTS.AZURE_AGENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'reset', resetConversation: true })
      });
      showToast(SUCCESS_MESSAGES.CONVERSATION_CLEARED);
    } catch (error) {
      console.log('Conversation reset requested');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-sage/20 flex flex-col">
      {/* Toast Notification */}
      <Toast toast={toast} />

      {/* Enhanced Header */}
      <header className="bg-white border-b border-rush-gray/20 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 md:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-5">
              <div className="relative w-[130px] h-10 md:w-[150px] md:h-12">
                <Image
                  src="/images/rush-logo.jpg"
                  alt="Rush University System for Health"
                  fill
                  sizes="(max-width: 768px) 130px, 150px"
                  priority
                  className="object-contain"
                />
              </div>
              <div className="h-10 md:h-12 w-px bg-gradient-to-b from-transparent via-rush-gray/40 to-transparent"></div>
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-bold text-legacy tracking-tight">Policy Chat</h1>
                <p className="hidden md:block text-sm text-rush-gray mt-0.5">Official PolicyTech Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-sage/30 rounded-full border border-growth/20">
              <div className="w-2 h-2 bg-growth rounded-full animate-pulse"></div>
              <span className="text-xs md:text-sm font-medium text-legacy">Ready</span>
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
                <p className="text-sm text-rush-black/70 mt-1">Get answers from 1300+ PolicyTech documents</p>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-vitality/10 rounded-lg border border-vitality/30">
                <Sparkles className="w-4 h-4 text-growth" />
                <span className="text-xs font-medium text-legacy">GPT-5 Chat</span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
            role="log"
            aria-label="Chat conversation history"
            aria-busy={isLoading}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center max-w-2xl">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-sage/30 rounded-full mb-6">
                    <FileText className="w-8 h-8 text-growth" />
                  </div>
                  <p className="text-base text-rush-black/60 mb-8">
                    Ask about HIPAA, PTO, infection control, remote work, or any Rush policy
                  </p>

                  {/* Suggested Prompts */}
                  <SuggestedPromptsGrid onPromptClick={handlePromptClick} />
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={generateKey(message, index)}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  role="article"
                  aria-label={`${message.type === 'user' ? 'Your question' : 'Assistant response'} ${index + 1}`}
                >
                  <MessageItem
                    message={message}
                    index={index}
                    parseResponse={parseResponse}
                    formatDocumentContent={formatDocumentContent}
                    copyToClipboard={copyToClipboard}
                    copiedIndex={copiedIndex}
                    generateKey={generateKey}
                  />
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-growth to-legacy rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border border-vitality/40">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div
                    className="bg-sage/40 px-6 py-4 rounded-2xl shadow-md border border-growth/30"
                    role="status"
                    aria-live="polite"
                    aria-label="Loading response"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2" aria-hidden="true">
                        <div className="w-2.5 h-2.5 bg-growth rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-vitality rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-legacy rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-legacy font-semibold voice-invested">Searching policies...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-rush-gray/20 p-6 bg-white">
            <form onSubmit={sendMessage} className="space-y-2">
              <div className="flex space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a policy question..."
                  className="flex-1 border border-rush-gray/30 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-growth focus:border-growth transition-all bg-white text-rush-black placeholder-rush-gray/60"
                  disabled={isLoading}
                  aria-label="Ask a policy question"
                  maxLength={PERFORMANCE.MAX_MESSAGE_LENGTH}
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
                    <span className="ml-2">Searching...</span>
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
            </div>

            {/* Character Counter */}
            {inputValue.length > 0 && (
              <div className="flex justify-end px-1">
                <span
                  className={`text-xs transition-colors ${
                    inputValue.length >= PERFORMANCE.CHARACTER_WARNING_THRESHOLD
                      ? 'text-red-600 font-semibold'
                      : 'text-rush-gray/60'
                  }`}
                  aria-live="polite"
                  aria-label={`${inputValue.length} of ${PERFORMANCE.MAX_MESSAGE_LENGTH} characters`}
                >
                  {inputValue.length} / {PERFORMANCE.MAX_MESSAGE_LENGTH}
                </span>
              </div>
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
