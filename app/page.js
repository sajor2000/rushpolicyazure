'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, AlertCircle, Shield, Loader2, User, MessageSquare, Building2, Plus, Zap, Users, Copy, CheckCheck, Sparkles, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

// Define Rush color classes for easier use
// Primary Palette:
// Vitality Green: #5FEEA2
// Growth Green: #00A66C
// Legacy Green: #006332
// Black: #0C0C0C (rush-black)

// Secondary Palette:
// Green: #00A66C (growth-green)
// Wash Green: #9AEFC2 (wash-green)
// Gray: #EAEAEA (rush-gray)
// Wash Gray: #A59F9F (wash-gray)
// Raw Umber: #5F5858 (raw-umber)

// Tertiary/Accent Colors:
// Sage: #DFF9EB (sage)
// Ivory: #FFFBEC (ivory)
// Rose: #FDE0DF (rose)
// Cerulean Blue: #54ADD3 (cerulean-blue)
// Deep Blue: #00668E (deep-blue)
// Purple: #694FA0 (purple)
// Indigo: #1E1869 (indigo)

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
              ? 'bg-growth-green text-white' 
              : 'bg-rose text-red-700'
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
                    <Building2 className="h-10 w-10 text-growth-green" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-vitality-green rounded-full animate-pulse"></div>
                  </div>
                  <div className="border-l border-gray-300 h-10"></div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Policy Assistant</h1>
                    <p className="text-sm text-gray-600">Rush University System for Health</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-sage/50 rounded-full">
                <Sparkles className="w-4 h-4 text-growth-green" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">⌘K</kbd>
                <span className="text-xs text-gray-500">to focus</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-white via-sage/20 to-ivory/30 py-12 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-4">
            <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-md border border-growth-green/20">
              <Shield className="h-4 w-4 text-growth-green" />
              <span className="text-sm font-medium text-growth-green">Internal Use Only</span>
            </div>
          </div>
          <h1 className="text-4xl font-semibold text-rush-black mb-4 tracking-tight">
            Rush Policy Assistant
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Search and chat with Rush University System for Health policies and procedures. Get instant answers to policy questions in a conversational format.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2 transition-transform hover:scale-105">
              <FileText className="h-4 w-4 text-growth-green" />
              <span>800+ Policy Documents</span>
            </div>
            <div className="flex items-center space-x-2 transition-transform hover:scale-105">
              <MessageSquare className="h-4 w-4 text-growth-green" />
              <span>Natural Language Search</span>
            </div>
            <div className="flex items-center space-x-2 transition-transform hover:scale-105">
              <Zap className="h-4 w-4 text-growth-green" />
              <span>Instant Responses</span>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Container */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 h-full max-h-[700px] flex flex-col overflow-hidden backdrop-blur-sm">
          {/* Chat Header */}
          <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-sage/30 to-ivory/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-rush-black mb-1">Policy Assistant Chat</h2>
                <p className="text-sm text-gray-600">Ask me anything about Rush University policies</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-growth-green rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Online</span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center mt-8">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-growth-green/10 to-sage rounded-2xl mb-4">
                    <FileText className="w-10 h-10 text-growth-green" />
                  </div>
                  <p className="text-xl font-semibold text-rush-black mb-2">Ask me about any Rush University System policy</p>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">Start a conversation by selecting a suggested prompt below or type your own question</p>
                </div>

                {/* Suggested Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mt-8">
                  {SUGGESTED_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(null, prompt.text)}
                      className="group p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-growth-green hover:bg-sage/10 transition-all duration-200 text-left transform hover:scale-105 hover:shadow-md"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-growth-green/10 to-sage rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-growth-green/20 group-hover:to-sage/50 transition-colors">
                          <prompt.icon className="w-5 h-5 text-growth-green" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-growth-green mb-1">{prompt.category}</p>
                          <p className="text-sm text-gray-700 font-medium line-clamp-2">{prompt.text}</p>
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
                      <div className="bg-gradient-to-br from-cerulean-blue to-deep-blue rounded-2xl px-5 py-4 shadow-lg hover:shadow-xl transition-shadow">
                        <p className="text-white font-medium">{message.content}</p>
                        <p className="text-blue-100 text-xs mt-2">{message.timestamp?.toLocaleTimeString()}</p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-cerulean-blue to-deep-blue rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : message.type === 'error' ? (
                    <div className="flex items-start space-x-3 w-full max-w-3xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-rose to-red-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-rose/20 border-2 border-rose rounded-2xl px-6 py-4 shadow-md">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <h3 className="font-semibold text-red-900">Error</h3>
                          </div>
                          <p className="text-red-800 leading-relaxed">{message.content}</p>
                          <p className="text-red-600 text-xs mt-2">{message.timestamp?.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-3 w-full max-w-3xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-growth-green to-legacy-green rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 space-y-4">
                        {(() => {
                          const { synthesizedAnswer, fullDocument } = parseResponse(message.content);

                          return (
                            <>
                              {/* AI Synthesized Answer */}
                              {synthesizedAnswer && (
                                <div className="bg-white rounded-2xl shadow-lg border border-cerulean-blue/30 overflow-hidden hover:shadow-xl transition-shadow">
                                  <div className="bg-gradient-to-r from-cerulean-blue to-deep-blue px-6 py-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <Sparkles className="w-5 h-5 text-white" />
                                        <h3 className="font-semibold text-white">AI Assistant Response</h3>
                                      </div>
                                      <button
                                        onClick={() => copyToClipboard(synthesizedAnswer, `synth-${index}`)}
                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                        title="Copy to clipboard"
                                      >
                                        {copiedIndex === `synth-${index}` ? (
                                          <CheckCheck className="w-4 h-4 text-white" />
                                        ) : (
                                          <Copy className="w-4 h-4 text-white" />
                                        )}
                                      </button>
                                    </div>
                                    <p className="text-blue-100 text-sm mt-1">Direct answer to your question</p>
                                  </div>
                                  <div className="p-6">
                                    <div className="text-rush-black leading-relaxed">
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
                  <div className="w-10 h-10 bg-gradient-to-br from-growth-green to-legacy-green rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-sage/50 px-6 py-4 rounded-2xl shadow-md border border-wash-green">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <div className="w-2.5 h-2.5 bg-growth-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-growth-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-growth-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-growth-green font-medium">Searching policies...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-ivory/30 to-sage/10">
            <form onSubmit={sendMessage} className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about any Rush policy, procedure, or guideline..."
                  className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-growth-green focus:border-growth-green transition-all duration-200 bg-white text-rush-black placeholder-gray-400 text-base shadow-sm hover:border-growth-green/50"
                  disabled={isLoading}
                />
                {inputValue && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Press Enter ↵
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-8 min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline ml-2">Searching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="hidden sm:inline ml-2">Send</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="btn-secondary px-6"
                disabled={messages.length === 0 && !inputValue}
              >
                Clear
              </button>
            </form>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>💡 Tip: Use ⌘K to focus the input</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-growth-green rounded-full"></div>
                <span>Ready to assist</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-4 py-6 text-center text-sm text-gray-600 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="w-4 h-4 text-vitality-green" />
            <span className="font-medium">Internal Rush University System Policy Assistant</span>
          </div>
          <p className="text-xs text-gray-500">Powered by Azure OpenAI GPT-4 • Secure & Confidential</p>
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
