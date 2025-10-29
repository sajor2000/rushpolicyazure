'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Shield, Users, Clock, Sparkles } from 'lucide-react';
import { PERFORMANCE, ERROR_MESSAGES, SUCCESS_MESSAGES, API_ENDPOINTS } from './constants';

// New shadcn-based Components
import Header from './components/layout/Header';
import MobileDrawer from './components/layout/MobileDrawer';
import ChatInput from './components/chat/ChatInput';
import SuggestedPrompts, { SuggestedPrompt } from './components/chat/SuggestedPrompts';
import MessageCard from './components/chat/MessageCard';
import DocumentViewer from './components/chat/DocumentViewer';
import { Card } from './components/ui/card';
import { ScrollArea } from './components/ui/scroll-area';

// Custom Hooks
import { useToast } from './hooks/useToast';
import { useClipboard } from './hooks/useClipboard';

// Utility Functions
import { parseResponse } from './utils/policyParser';
import { formatDocumentContent } from './utils/documentFormatter';

// Types
interface Message {
  type: 'user' | 'bot' | 'error';
  content: string;
  timestamp: Date;
}

// Timestamp-based key generation for stable, unique React keys
function generateKey(message: Message, index: number): string {
  const timestamp = message.timestamp?.getTime() || Date.now();
  return `msg-${timestamp}-${index}`;
}

/**
 * Rush Policy Assistant - Azure GPT-5 Chat Model
 *
 * World-class responsive shadcn/ui implementation with mobile-first design
 */

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { icon: Shield, text: "What are our HIPAA privacy requirements?", category: "Compliance & Privacy" },
  { icon: FileText, text: "Show me the infection control policy", category: "Clinical Guidance" },
  { icon: Users, text: "Can I work remotely?", category: "Workforce & HR" },
  { icon: Clock, text: "How does PTO accrual work?", category: "Time & Benefits" },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{document: string; metadata: any; timestamp: Date} | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use custom hooks
  const { showToast } = useToast();
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
      messagesEndRef.current?.scrollIntoView({ behavior: scrollBehavior as ScrollBehavior });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized sendMessage
  const sendMessage = useCallback(async (e: React.FormEvent | null, promptText: string | null = null) => {
    if (e) e.preventDefault();
    const messageToSend = promptText || inputValue;

    // Sanitize control characters
    const sanitizedMessage = messageToSend
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .trim();

    // Input validation
    if (!sanitizedMessage || isLoading) return;

    // Character limit validation
    if (sanitizedMessage.length > PERFORMANCE.MAX_MESSAGE_LENGTH) {
      showToast(ERROR_MESSAGES.MESSAGE_TOO_LONG(PERFORMANCE.MAX_MESSAGE_LENGTH), 'error');
      return;
    }

    setInputValue('');

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: sanitizedMessage, timestamp: new Date() }]);
    setIsLoading(true);

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(API_ENDPOINTS.AZURE_AGENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: sanitizedMessage
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
    } catch (error: any) {
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
  }, [inputValue, isLoading, showToast]);

  // Memoized callback for suggested prompts
  const handlePromptClick = useCallback((promptText: string) => {
    sendMessage(null, promptText);
  }, [sendMessage]);

  // Memoized clear handler
  const handleClear = useCallback(() => {
    setInputValue('');
    setMessages([]);
    showToast(SUCCESS_MESSAGES.CONVERSATION_CLEARED);
  }, [showToast]);

  // Handle document viewer
  const handleViewDocument = useCallback((document: string, metadata: any, timestamp: Date) => {
    setSelectedDocument({ document, metadata, timestamp });
    setDocumentViewerOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sage/10 to-vitality/5 flex flex-col">
      {/* Header */}
      <Header onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onClearConversation={handleClear}
        messageCount={messages.length}
      />

      {/* Main Content - Redesigned with world-class layout */}
      <main className="flex-1 container mx-auto px-3 md:px-6 py-4 md:py-6 lg:py-8 flex flex-col">
        {/* Welcome Section - Only show when no messages */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center mb-6 md:mb-8 animate-fade-in">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-growth via-vitality to-legacy blur-2xl opacity-20 animate-pulse" />
              <div className="relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-growth to-legacy rounded-2xl shadow-xl">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-legacy mb-2 md:mb-3">
              Ask Anything About Rush Policies
            </h2>
            <p className="text-sm md:text-base lg:text-lg text-rush-black/70 max-w-2xl mb-6 md:mb-8 px-4">
              Instant answers from 1,300+ PolicyTech documents. HIPAA, PTO, infection control, remote work, and more.
            </p>

            {/* Suggested Prompts - Prominent Display */}
            <div className="w-full max-w-3xl">
              <h3 className="text-sm md:text-base font-semibold text-rush-black/60 mb-4 text-left px-1">
                Popular Questions
              </h3>
              <SuggestedPrompts
                prompts={SUGGESTED_PROMPTS}
                onPromptClick={handlePromptClick}
              />
            </div>
          </div>
        )}

        {/* Chat Container - Enhanced Design */}
        <Card className={`flex-1 flex flex-col shadow-2xl border-growth/20 overflow-hidden transition-all duration-300 ${messages.length === 0 ? 'max-w-5xl mx-auto w-full' : ''}`}>
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-3 md:p-6 lg:p-8">
            <div
              ref={messagesContainerRef}
              className="space-y-4 md:space-y-6"
              role="log"
              aria-label="Chat conversation history"
              aria-busy={isLoading}
            >
              {messages.length > 0 ? (
                messages.map((message, index) => (
                  <div
                    key={generateKey(message, index)}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <MessageCard
                      message={message}
                      index={index}
                      parseResponse={parseResponse}
                      onCopy={copyToClipboard}
                      copiedKey={copiedIndex}
                      onViewDocument={(doc, meta) => handleViewDocument(doc, meta, message.timestamp)}
                    />
                  </div>
                ))
              ) : null}

              {/* Loading Indicator - Enhanced */}
              {isLoading && (
                <div className="flex justify-start animate-fade-in-up">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-growth via-vitality to-legacy rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border border-vitality/40 animate-pulse">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div
                      className="bg-gradient-to-r from-sage/40 to-vitality/20 px-6 py-4 rounded-2xl shadow-lg border border-growth/30"
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
                        <span className="text-sm font-semibold bg-gradient-to-r from-growth to-legacy bg-clip-text text-transparent">
                          Searching policies...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Chat Input - Enhanced Design */}
          <div className="border-t border-growth/20 bg-gradient-to-r from-white to-sage/5">
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={sendMessage}
              onClear={handleClear}
              isLoading={isLoading}
              maxLength={PERFORMANCE.MAX_MESSAGE_LENGTH}
              showClear={messages.length > 0}
            />
          </div>
        </Card>
      </main>

      {/* Footer - Refined */}
      <footer className="py-3 md:py-4 text-center text-xs text-rush-black/50 border-t border-rush-gray/10">
        <div className="container mx-auto px-4 md:px-6">
          <p>Rush University System for Health • Internal Use Only • Powered by Azure GPT-5</p>
        </div>
      </footer>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          open={documentViewerOpen}
          onClose={() => setDocumentViewerOpen(false)}
          document={selectedDocument.document}
          metadata={selectedDocument.metadata}
          onCopy={copyToClipboard}
          copiedKey={copiedIndex}
          formatDocumentContent={formatDocumentContent}
          timestamp={selectedDocument.timestamp}
        />
      )}
    </div>
  );
}
