'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, AlertCircle, Shield, Loader2, User, MessageSquare, Building2, Plus, Zap, Users, Copy, CheckCheck, Sparkles, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

/**
 * Rush University Medical Center - Official Brand Color Palette
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
  { icon: Clock, text: "What is the vacation policy?", category: "Time Off" },
  { icon: Shield, text: "Tell me about HIPAA compliance requirements", category: "Compliance" },
  { icon: Users, text: "What's the remote work policy?", category: "Work Policies" },
  { icon: TrendingUp, text: "Employee benefits overview", category: "Benefits" },
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

  // Parse and format dual-response content
  const parseResponse = (content) => {
    const synthesizedMatch = content.match(/SYNTHESIZED_ANSWER:\s*(.*?)\s*(?=FULL_POLICY_DOCUMENT:|$)/s);
    const documentMatch = content.match(/FULL_POLICY_DOCUMENT:\s*(.*)/s);

    return {
      synthesizedAnswer: synthesizedMatch ? synthesizedMatch[1].trim() : '',
      fullDocument: documentMatch ? documentMatch[1].trim() : content
    };
  };

  // Format content to look like a policy document (for full document section)
  const formatDocumentContent = (content) => {
    const lines = content.split('\n');
    const formatted = [];
    let isHeaderSection = true;
    let headerLines = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Detect header information (first several lines with colons)
      if (isHeaderSection && (trimmedLine.includes(':') || trimmedLine.match(/^(Policy Title|Former Policy Number|Document Owner|Approver|Date|Review Due|Applies To|Reference Number)/))) {
        headerLines.push(trimmedLine);
        return;
      } else if (isHeaderSection && trimmedLine === '') {
        // Empty line after header, render header block
        if (headerLines.length > 0) {
          formatted.push(
            <div key="header" className="policy-header-info">
              {headerLines.map((headerLine, idx) => (
                <p key={idx} className="text-xs text-black">{headerLine}</p>
              ))}
            </div>
          );
        }
        isHeaderSection = false;
        return;
      } else if (isHeaderSection) {
        isHeaderSection = false;
        if (headerLines.length > 0) {
          formatted.push(
            <div key="header" className="policy-header-info">
              {headerLines.map((headerLine, idx) => (
                <p key={idx} className="text-xs text-black">{headerLine}</p>
              ))}
            </div>
          );
        }
      }

      if (!trimmedLine) {
        formatted.push(<div key={index} className="mb-2"></div>);
        return;
      }

      // Roman numerals or main sections
      if (/^[IVX]+\.\s/.test(trimmedLine) || trimmedLine.match(/^(I\.|II\.|III\.|IV\.|V\.)/)) {
        formatted.push(
          <h2 key={index} className="policy-section-header font-bold text-black mt-4 mb-2 text-sm">
            {trimmedLine}
          </h2>
        );
      }
      // Letter subsections (A., B., C., etc.)
      else if (/^[A-Z]\.\s/.test(trimmedLine)) {
        formatted.push(
          <div key={index} className="policy-subsection mb-3">
            <p className="font-semibold text-black text-xs mb-1">{trimmedLine}</p>
          </div>
        );
      }
      // Numbered items (i., ii., iii., etc.)
      else if (/^[ivx]+\.\s/.test(trimmedLine)) {
        formatted.push(
          <div key={index} className="policy-item ml-6 mb-2">
            <p className="text-black text-xs">{trimmedLine}</p>
          </div>
        );
      }
      // Regular paragraphs
      else {
        formatted.push(
          <p key={index} className="mb-2 text-black text-xs leading-relaxed text-justify">
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageToSend,
          resetConversation: messages.length === 0
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || `HTTP error! status: ${response.status}`);
      }

      // Add bot response
      setMessages(prev => [...prev, { type: 'bot', content: data.response, timestamp: new Date() }]);
      showToast('Response received!');
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error.message.includes('invalid_deployment') 
        ? 'The Azure OpenAI deployment is not configured correctly. Please check the ASSISTANT_ID and ensure the deployment exists in your Azure OpenAI resource.'
        : error.message || 'I apologize, but I\'m having trouble connecting to the PolicyTech database. Please try again or contact IT support if the issue persists.';
      
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
      await fetch('/api/chat', {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sage/30 flex flex-col">
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

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Building2 className="h-10 w-10 text-growth" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-vitality rounded-full animate-pulse"></div>
                  </div>
                  <div className="border-l border-rush-gray h-10"></div>
                  <div>
                    <h1 className="text-xl font-semibold text-legacy">Policy Assistant</h1>
                    <p className="text-sm text-rush-black font-georgia">Rush University System for Health</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-rush-black">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-sage/50 rounded-full border border-growth/20">
                <Sparkles className="w-4 h-4 text-growth" />
                <span className="font-medium">AI-Powered</span>
              </div>
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 text-xs font-mono bg-sage border border-growth/30 rounded text-legacy">⌘K</kbd>
                <span className="text-xs text-rush-gray">to focus</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-white via-sage/30 to-blush/20 py-12 border-b border-rush-gray/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-4">
            <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-md border border-growth/30">
              <Shield className="h-4 w-4 text-growth" />
              <span className="text-sm font-semibold text-legacy">Internal Use Only</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-legacy mb-4 tracking-tight voice-inventive">
            Rush Policy Assistant
          </h1>
          <p className="text-lg text-rush-black mb-8 max-w-2xl mx-auto leading-relaxed voice-accessible font-georgia">
            Search and chat with Rush University System for Health policies and procedures. Get instant answers to policy questions in a conversational format.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-rush-black">
            <div className="flex items-center space-x-2 transition-transform hover:scale-105 px-3 py-1.5 bg-sage/30 rounded-full">
              <FileText className="h-4 w-4 text-growth" />
              <span className="font-medium">800+ Policy Documents</span>
            </div>
            <div className="flex items-center space-x-2 transition-transform hover:scale-105 px-3 py-1.5 bg-sand/30 rounded-full">
              <MessageSquare className="h-4 w-4 text-navy" />
              <span className="font-medium">Natural Language Search</span>
            </div>
            <div className="flex items-center space-x-2 transition-transform hover:scale-105 px-3 py-1.5 bg-blush/30 rounded-full">
              <Zap className="h-4 w-4 text-gold" />
              <span className="font-medium">Instant Responses</span>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Container */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 h-full max-h-[700px] flex flex-col overflow-hidden backdrop-blur-sm">
          {/* Chat Header */}
          <div className="border-b border-rush-gray/30 p-6 bg-gradient-to-r from-sage/20 to-sand/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-legacy mb-1">Policy Assistant Chat</h2>
                <p className="text-sm text-rush-black font-georgia voice-accessible">Ask me anything about Rush University policies</p>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-white rounded-full border border-growth/20">
                <div className="w-2 h-2 bg-growth rounded-full animate-pulse"></div>
                <span className="text-xs text-legacy font-medium">Online</span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center mt-8">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-growth/20 to-sage rounded-2xl mb-4 border-2 border-vitality/30">
                    <FileText className="w-10 h-10 text-growth" />
                  </div>
                  <p className="text-xl font-semibold text-legacy mb-2 voice-inventive">Ask me about any Rush University System policy</p>
                  <p className="text-sm text-rush-black max-w-md mx-auto font-georgia voice-accessible">Start a conversation by selecting a suggested prompt below or type your own question</p>
                </div>

                {/* Suggested Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mt-8">
                  {SUGGESTED_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(null, prompt.text)}
                      className="group p-4 bg-white border-2 border-rush-gray/30 rounded-xl hover:border-growth hover:bg-sage/20 transition-all duration-200 text-left transform hover:scale-105 hover:shadow-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-growth/10 to-vitality/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-growth/30 group-hover:to-vitality/40 transition-colors border border-growth/20">
                          <prompt.icon className="w-5 h-5 text-growth" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-growth mb-1">{prompt.category}</p>
                          <p className="text-sm text-rush-black font-medium line-clamp-2 voice-inclusive">{prompt.text}</p>
                        </div>
                      </div>
                    </button>
                  ))}
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
                        <p className="text-sky-blue/80 text-xs mt-2 font-georgia">{message.timestamp?.toLocaleTimeString()}</p>
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
                    <div className="flex items-start space-x-3 w-full max-w-3xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-growth to-legacy rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border border-vitality/40">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 space-y-4">
                        {(() => {
                          const { synthesizedAnswer, fullDocument } = parseResponse(message.content);

                          return (
                            <>
                              {/* AI Synthesized Answer */}
                              {synthesizedAnswer && (
                                <div className="bg-white rounded-2xl shadow-lg border-2 border-sky-blue/30 overflow-hidden hover:shadow-xl transition-shadow">
                                  <div className="bg-gradient-to-r from-sky-blue to-navy px-6 py-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <Sparkles className="w-5 h-5 text-white" />
                                        <h3 className="font-semibold text-white voice-invested">AI Assistant Response</h3>
                                      </div>
                                      <button
                                        onClick={() => copyToClipboard(synthesizedAnswer, `synth-${index}`)}
                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                        title="Copy to clipboard"
                                        aria-label="Copy response to clipboard"
                                      >
                                        {copiedIndex === `synth-${index}` ? (
                                          <CheckCheck className="w-4 h-4 text-white" aria-hidden="true" />
                                        ) : (
                                          <Copy className="w-4 h-4 text-white" aria-hidden="true" />
                                        )}
                                      </button>
                                    </div>
                                    <p className="text-white/80 text-sm mt-1 font-georgia">Direct answer to your question</p>
                                  </div>
                                  <div className="p-6 bg-gradient-to-b from-white to-sage/10">
                                    <div className="text-rush-black leading-relaxed font-georgia voice-accessible">
                                      {synthesizedAnswer.split('\n').map((paragraph, idx) => (
                                        paragraph.trim() && (
                                          <p key={idx} className="mb-3 last:mb-0">{paragraph.trim()}</p>
                                        )
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Full Policy Document */}
                              <div className="bg-white border-2 border-gray-300 shadow-lg overflow-hidden rounded-2xl hover:shadow-xl transition-shadow">
                                {/* Document Header */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-300">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <FileText className="w-5 h-5 text-gray-600" />
                                      <h3 className="font-semibold text-gray-800">Rush University System for Health Policy Document</h3>
                                    </div>
                                    <button
                                      onClick={() => copyToClipboard(fullDocument, `doc-${index}`)}
                                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                      title="Copy document"
                                    >
                                      {copiedIndex === `doc-${index}` ? (
                                        <CheckCheck className="w-4 h-4 text-growth-green" />
                                      ) : (
                                        <Copy className="w-4 h-4 text-gray-600" />
                                      )}
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">PolicyTech Database - Official Document</p>
                                </div>

                                {/* Document Content - Clean White Document Format */}
                                <div className="p-8 bg-white">
                                  <div className="policy-document">
                                    {formatDocumentContent(fullDocument)}
                                  </div>

                                  {/* Document Footer */}
                                  <div className="mt-8 pt-4 border-t border-wash-green">
                                    <div className="text-xs text-wash-gray space-y-1">
                                      <p>📄 Source: Rush University System PolicyTech Database</p>
                                      <p>🔒 Access Level: Authorized Rush Personnel Only</p>
                                      <p>📅 Retrieved: {message.timestamp?.toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}</p>
                                      <p>⚠️ This document is the property of Rush University System for Health</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
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
          <div className="border-t border-rush-gray/30 p-6 bg-gradient-to-r from-sand/20 to-sage/20">
            <form onSubmit={sendMessage} className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about any Rush policy, procedure, or guideline..."
                  className="w-full border-2 border-rush-gray/40 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-growth focus:border-growth transition-all duration-200 bg-white text-rush-black placeholder-rush-gray text-base shadow-sm hover:border-growth/50 font-georgia"
                  disabled={isLoading}
                  aria-label="Ask a policy question"
                />
                {inputValue && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-rush-gray font-medium">
                    Press Enter ↵
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-8 min-w-[120px]"
                aria-label="Send message"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span className="hidden sm:inline ml-2 voice-invested">Searching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" aria-hidden="true" />
                    <span className="hidden sm:inline ml-2 voice-invested">Send</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="btn-secondary px-6"
                disabled={messages.length === 0 && !inputValue}
                aria-label="Clear conversation"
              >
                Clear
              </button>
            </form>
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4 text-rush-black">
                <span className="font-georgia">💡 Tip: Use ⌘K to focus the input</span>
              </div>
              <div className="flex items-center space-x-2 px-2 py-1 bg-white rounded-full border border-growth/20">
                <div className="w-1.5 h-1.5 bg-growth rounded-full animate-pulse"></div>
                <span className="text-legacy font-medium">Ready to assist</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-4 py-6 text-center text-sm border-t border-rush-gray/30 bg-gradient-to-r from-sage/10 to-sand/10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="w-4 h-4 text-growth" />
            <span className="font-semibold text-legacy">Internal Rush University System Policy Assistant</span>
          </div>
          <p className="text-xs text-rush-black font-georgia">Powered by Azure OpenAI GPT-4 • Secure & Confidential</p>
          <div className="mt-2 flex items-center justify-center space-x-3 text-xs text-rush-gray">
            <span>Inclusive</span>
            <span>•</span>
            <span>Invested</span>
            <span>•</span>
            <span>Inventive</span>
            <span>•</span>
            <span>Accessible</span>
          </div>
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
