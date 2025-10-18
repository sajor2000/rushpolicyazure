'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, FileText, AlertCircle, Shield, Loader2, User, MessageSquare, Users, Copy, CheckCheck, Sparkles, Clock, AlertTriangle, Building2 } from 'lucide-react';

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

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Parse response and extract metadata for PDF-style display
  const parseResponse = (content) => {
    // Extract key metadata from the response
    const policyNumberMatch = content.match(/(?:Policy\s*(?:Number|#)?|Reference\s*Number)\s*:?\s*([A-Z0-9\-]+)/i);
    const titleMatch = content.match(/(?:Policy\s*Title)\s*:?\s*([^\n]+)/i);
    const effectiveDateMatch = content.match(/(?:Effective\s*Date|Date\s*Approved)\s*:?\s*([^\n]+)/i);
    const departmentMatch = content.match(/(?:Department|Applies\s*To|Document\s*Owner)\s*:?\s*([^\n]+)/i);

    return {
      content: content, // Full content as-is
      metadata: {
        policyNumber: policyNumberMatch ? policyNumberMatch[1].trim() : null,
        policyTitle: titleMatch ? titleMatch[1].trim() : null,
        effectiveDate: effectiveDateMatch ? effectiveDateMatch[1].trim() : null,
        department: departmentMatch ? departmentMatch[1].trim() : null,
      }
    };
  };

  // PDF-style document formatting with professional typography
  const formatDocumentContent = (content) => {
    const lines = content.split('\n');
    const formatted = [];
    let currentSection = null;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines but preserve spacing
      if (!trimmedLine) {
        formatted.push(<div key={`space-${index}`} className="h-4"></div>);
        return;
      }

      // Major section headers (### style or Section:)
      if (trimmedLine.startsWith('###') || trimmedLine.match(/^(POLICY|SECTION|PROCEDURE|DEFINITIONS?|REFERENCES?|SCOPE|PURPOSE)/i)) {
        const headerText = trimmedLine.replace(/^###\s*/, '').replace(/^📋\s*/, '');
        formatted.push(
          <h2 key={index} className="pdf-section-header">
            {headerText}
          </h2>
        );
      }
      // Subsection headers (** style or bold indicators)
      else if (trimmedLine.startsWith('**') || trimmedLine.match(/^[IVX]+\.\s/) || trimmedLine.match(/^\d+\.\s[A-Z]/)) {
        const headerText = trimmedLine.replace(/^\*\*/, '').replace(/\*\*$/, '');
        formatted.push(
          <h3 key={index} className="pdf-subsection-header">
            {headerText}
          </h3>
        );
      }
      // Metadata lines (key: value format)
      else if (trimmedLine.includes(':') && trimmedLine.length < 100 && !trimmedLine.match(/^[a-z]/)) {
        const [key, ...valueParts] = trimmedLine.split(':');
        const value = valueParts.join(':').trim();
        formatted.push(
          <div key={index} className="pdf-metadata-line">
            <span className="pdf-metadata-key">{key}:</span>
            <span className="pdf-metadata-value">{value}</span>
          </div>
        );
      }
      // Bulleted list items
      else if (trimmedLine.match(/^[•\-\*]\s/) || trimmedLine.match(/^[☒☐]\s/)) {
        const text = trimmedLine.replace(/^[•\-\*☒☐]\s*/, '');
        const isChecked = trimmedLine.startsWith('☒');
        formatted.push(
          <div key={index} className="pdf-list-item">
            <span className="pdf-bullet">{isChecked ? '☑' : '•'}</span>
            <span>{text}</span>
          </div>
        );
      }
      // Numbered list items (a., i., 1., etc.)
      else if (trimmedLine.match(/^[a-z]\.\s/) || trimmedLine.match(/^[ivx]+\.\s/) || trimmedLine.match(/^\d+\.\s/)) {
        formatted.push(
          <div key={index} className="pdf-numbered-item">
            {trimmedLine}
          </div>
        );
      }
      // Quoted or highlighted text (>)
      else if (trimmedLine.startsWith('>')) {
        const text = trimmedLine.replace(/^>\s*/, '');
        formatted.push(
          <blockquote key={index} className="pdf-blockquote">
            {text}
          </blockquote>
        );
      }
      // Separator lines (---, ===)
      else if (trimmedLine.match(/^[-=]{3,}$/)) {
        formatted.push(
          <hr key={index} className="pdf-separator" />
        );
      }
      // Warning/Note indicators
      else if (trimmedLine.match(/^⚠️|^💡|^ℹ️|^NOTE:|^WARNING:/i)) {
        formatted.push(
          <div key={index} className="pdf-notice">
            {trimmedLine}
          </div>
        );
      }
      // Regular paragraph text
      else {
        formatted.push(
          <p key={index} className="pdf-paragraph">
            {trimmedLine}
          </p>
        );
      }
    });

    return formatted;
  };

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

  const sendMessage = async (e, promptText = null) => {
    if (e) e.preventDefault();
    const messageToSend = promptText || inputValue;
    if (!messageToSend.trim() || isLoading) return;

    setInputValue('');

    // Add user message with animation
    setMessages(prev => [...prev, { type: 'user', content: messageToSend, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/azure-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          resetConversation: messages.length === 0
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error('Invalid response from server. The policy data may contain formatting issues.');
      }

      if (!response.ok) {
        throw new Error(data.details || data.error || `HTTP error! status: ${response.status}`);
      }

      // Add bot response
      setMessages(prev => [...prev, { type: 'bot', content: data.response, timestamp: new Date() }]);
      showToast('Response received!');
    } catch (error) {
      console.error("Error sending message:", error);
      const messageText = typeof error === 'string' ? error : error?.message;
      let errorMessage = messageText || 'I apologize, but I\'m having trouble connecting to the PolicyTech database. Please try again or contact IT support if the issue persists.';
      
      setMessages(prev => [...prev, {
        type: 'error',
        content: errorMessage,
        timestamp: new Date()
      }]);
      showToast('Error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setInputValue('');
    setMessages([]);
    try {
      await fetch('/api/azure-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'reset', resetConversation: true })
      });
      showToast('Conversation cleared');
    } catch (error) {
      console.log('Conversation reset requested');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-sage/20 flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-out ${
            toast.type === 'success' 
              ? 'bg-growth text-white' 
              : 'bg-blush border-2 border-red-500 text-red-700'
          } animate-slide-in-right`}
        >
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? (
              <CheckCheck className="w-5 h-5" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-5 h-5" aria-hidden="true" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Simple Header */}
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
                <p className="text-sm text-rush-black/70 mt-1">Get answers from 1300+ PolicyTech documents</p>
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
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center max-w-2xl">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-sage/30 rounded-full mb-6">
                    <FileText className="w-8 h-8 text-growth" />
                  </div>
                  <p className="text-base text-rush-black/60 mb-8">
                    Ask about HIPAA, PTO, infection control, remote work, or any Rush policy
                  </p>

                  {/* Suggested Prompts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SUGGESTED_PROMPTS.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => sendMessage(null, prompt.text)}
                        className="p-4 bg-white border border-rush-gray/30 rounded-lg hover:border-growth hover:bg-sage/10 transition-all text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <prompt.icon className="w-5 h-5 text-growth flex-shrink-0" />
                          <span className="text-sm text-rush-black">{prompt.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {message.type === 'user' ? (
                    <div className="flex items-start space-x-3 justify-end max-w-2xl">
                      <div className="bg-gradient-to-br from-navy to-purple rounded-2xl px-5 py-4 shadow-lg hover:shadow-xl transition-shadow border border-navy/20">
                        <p className="text-white font-medium voice-inclusive">{message.content}</p>
                        <p className="text-white/90 text-xs mt-2 font-georgia">{message.timestamp?.toLocaleTimeString()}</p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-navy to-purple rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border border-violet/30">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : message.type === 'error' ? (
                    <div className="flex items-start space-x-3 w-full max-w-3xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-blush to-red-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-blush/40 border-2 border-red-400 rounded-2xl px-6 py-4 shadow-md">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-700" />
                            <h3 className="font-semibold text-red-900">Error</h3>
                          </div>
                          <p className="text-red-900 leading-relaxed voice-accessible font-georgia">{message.content}</p>
                          <p className="text-red-700 text-xs mt-2">{message.timestamp?.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // PDF-Style Single Document
                    <div className="flex items-start space-x-3 w-full max-w-4xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-growth to-legacy rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        {(() => {
                          const { content, metadata } = parseResponse(message.content);

                          return (
                            <div className="pdf-document-container">
                              {/* PDF Document Header */}
                              <div className="pdf-header">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-3">
                                    <img src="/images/rush-logo.jpg" alt="Rush" className="h-8 object-contain" />
                                    <div className="border-l border-rush-gray h-8"></div>
                                    <div>
                                      <h3 className="font-semibold text-legacy text-lg">Rush University Policy Document</h3>
                                      <p className="text-xs text-rush-black/70">PolicyTech Database</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => copyToClipboard(content, `doc-${index}`)}
                                    className="pdf-copy-button"
                                    title="Copy document"
                                    aria-label="Copy document to clipboard"
                                  >
                                    {copiedIndex === `doc-${index}` ? (
                                      <>
                                        <CheckCheck className="w-4 h-4" aria-hidden="true" />
                                        <span>Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-4 h-4" aria-hidden="true" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Metadata Bar */}
                                {(metadata.policyNumber || metadata.policyTitle || metadata.effectiveDate || metadata.department) && (
                                  <div className="pdf-metadata-bar">
                                    {metadata.policyNumber && (
                                      <span className="pdf-badge">
                                        <FileText className="w-3 h-3" />
                                        Policy #{metadata.policyNumber}
                                      </span>
                                    )}
                                    {metadata.effectiveDate && (
                                      <span className="pdf-badge">
                                        <Clock className="w-3 h-3" />
                                        {metadata.effectiveDate}
                                      </span>
                                    )}
                                    {metadata.department && (
                                      <span className="pdf-badge">
                                        <Building2 className="w-3 h-3" />
                                        {metadata.department}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* PDF Document Body */}
                              <div className="pdf-body">
                                {formatDocumentContent(content)}
                              </div>

                              {/* PDF Document Footer */}
                              <div className="pdf-footer">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-rush-black/70">
                                  <div>
                                    <div className="mb-1">
                                      <span className="font-semibold">Source:</span> Rush PolicyTech Database
                                    </div>
                                    <div>
                                      <span className="font-semibold">Access:</span> Authorized Personnel Only
                                    </div>
                                  </div>
                                  <div className="md:text-right">
                                    <div className="mb-1">
                                      <span className="font-semibold">Retrieved:</span> {message.timestamp?.toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                    <div>
                                      <span className="font-semibold">Property of:</span> Rush University System for Health
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-growth to-legacy rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border border-vitality/40">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-sage/40 px-6 py-4 rounded-2xl shadow-md border border-growth/30">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
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
