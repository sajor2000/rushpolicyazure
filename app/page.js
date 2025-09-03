'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, AlertCircle, Shield, Loader2, User, MessageSquare, Building2, Plus, Zap, Users } from 'lucide-react';

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

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        formatted.push(<div key={index} className="mb-3"></div>);
        return;
      }

      // Main headers (all caps or title case with colons)
      if (trimmedLine.includes(':') && (trimmedLine === trimmedLine.toUpperCase() || /^[A-Z][a-z]/.test(trimmedLine))) {
        formatted.push(
          <h2 key={index} className="text-lg font-bold text-rush-black mb-3 mt-6 first:mt-0 border-b border-gray-300 pb-2">
            {trimmedLine}
          </h2>
        );
      }
      // Numbered sections (1., 2., 3., etc.)
      else if (/^\d+\./.test(trimmedLine)) {
        formatted.push(
          <div key={index} className="mb-3">
            <h3 className="font-semibold text-rush-black mb-2">{trimmedLine}</h3>
          </div>
        );
      }
      // Lettered subsections (a., b., c., etc.)
      else if (/^[a-z]\./i.test(trimmedLine)) {
        formatted.push(
          <div key={index} className="ml-6 mb-2">
            <p className="text-raw-umber">{trimmedLine}</p>
          </div>
        );
      }
      // Bullet points or dashes
      else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        formatted.push(
          <div key={index} className="ml-8 mb-2 flex items-start">
            <span className="mr-2 text-growth-green">•</span>
            <p className="text-raw-umber flex-1">{trimmedLine.substring(1).trim()}</p>
          </div>
        );
      }
      // Regular paragraphs
      else {
        formatted.push(
          <p key={index} className="mb-3 text-raw-umber leading-relaxed">
            {trimmedLine}
          </p>
        );
      }
    });

    return formatted;
  };

  const sendMessage = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setInputValue('');

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add bot response
      setMessages(prev => [...prev, { type: 'bot', content: data.response }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'I apologize, but I\'m having trouble connecting to the PolicyTech database. Please try again or contact IT support if the issue persists.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-10 w-10 text-rush-green" />
                  <div className="border-l border-gray-300 h-10"></div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Policy Assistant</h1>
                    <p className="text-sm text-gray-600">Rush University System for Health</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
              <span>Policies & Procedures</span>
              <span>•</span>
              <span>AI-Powered Search</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-20 relative overflow-hidden">
        {/* Background decorative elements - inspired by Rush website */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 text-sage opacity-10">
            <Plus className="h-8 w-8" />
          </div>
          <div className="absolute top-40 right-32 text-sage opacity-10">
            <Plus className="h-6 w-6" />
          </div>
          <div className="absolute bottom-32 left-1/4 text-sage opacity-10">
            <Plus className="h-10 w-10" />
          </div>
          <div className="absolute bottom-20 right-20 text-sage opacity-10">
            <Plus className="h-7 w-7" />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              Among the nation's best
              <span className="block text-rush-green">policy guidance.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
              I'm here to help you find and understand all the Rush University System for Health policies, procedures, and guidelines that are available also in PolicyTech, but here you can chat with them in a conversational way and get the right answer when you need it.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <div className="flex items-center text-gray-600">
                <Shield className="h-6 w-6 mr-3 text-rush-green" />
                <span className="text-lg">Secure & Compliant</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Zap className="h-6 w-6 mr-3 text-rush-green" />
                <span className="text-lg">Real-time Search</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="h-6 w-6 mr-3 text-rush-green" />
                <span className="text-lg">For Rush Staff</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="max-w-4xl mx-auto w-full px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <MessageSquare className="h-7 w-7 text-rush-green" />
              <h2 className="text-2xl font-semibold text-gray-900">Ask a Question</h2>
            </div>
            <form onSubmit={sendMessage} className="space-y-6">
              <div>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about any Rush policy, procedure, or guideline..."
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-rush-green focus:border-rush-green resize-none text-lg placeholder-gray-500 transition-all duration-200"
                  rows={4}
                  disabled={isLoading}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="flex-1 bg-rush-green text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-700 focus:outline-none focus:ring-3 focus:ring-rush-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-6 w-6 mr-3" />
                      Searching policies...
                    </>
                  ) : (
                    <>
                      <Send className="h-6 w-6 mr-3" />
                      Search
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputValue('');
                    setMessages([]); // Clear messages when clearing input
                  }}
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-rush-gray h-full max-h-[600px] flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="border-b border-rush-gray p-6 bg-gradient-to-r from-sage to-ivory">
            <h2 className="text-xl font-semibold text-rush-black mb-2">Policy Assistant Chat</h2>
            <p className="text-sm text-raw-umber leading-relaxed">Ask me anything about Rush University policies</p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold text-rush-black mb-2">Ask me about any Rush University System policy</p>
                <p className="text-sm text-raw-umber leading-relaxed">Example: &quot;What is the vacation policy?&quot; or &quot;Tell me about HIPAA compliance requirements&quot;</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'user' ? (
                    <div className="flex items-start space-x-4 justify-end">
                      <div className="bg-gradient-to-br from-cerulean-blue to-deep-blue rounded-xl px-5 py-4 max-w-md shadow-md">
                        <p className="text-white font-medium">{message.content}</p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-cerulean-blue to-deep-blue rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-4">
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
                                <div className="bg-white rounded-xl shadow-md border border-cerulean-blue overflow-hidden">
                                  <div className="bg-gradient-to-r from-cerulean-blue to-deep-blue px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                      <Shield className="w-5 h-5 text-white" />
                                      <h3 className="font-semibold text-white">AI Assistant Response</h3>
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
                              <div className="bg-white rounded-xl shadow-md border border-wash-green document-style overflow-hidden">
                                {/* Document Header */}
                                <div className="bg-sage px-6 py-4 border-b border-wash-green">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="w-5 h-5 text-growth-green" />
                                    <h3 className="font-semibold text-rush-black">Rush University System for Health Policy Document</h3>
                                  </div>
                                  <p className="text-sm text-raw-umber mt-1">Exact copy from PolicyTech database</p>
                                </div>

                                {/* Document Content - Exact PolicyTech Format */}
                                <div className="p-6 bg-white" style={{ fontFamily: 'Times, serif', fontSize: '12px', lineHeight: '1.4' }}>
                                  <div className="document-content policy-document">
                                    {formatDocumentContent(fullDocument)}
                                  </div>

                                  {/* Document Footer */}
                                  <div className="mt-8 pt-4 border-t border-wash-green">
                                    <div className="text-xs text-wash-gray space-y-1">
                                      <p>📄 Source: Rush University System PolicyTech Database</p>
                                      <p>🔒 Access Level: Authorized Rush Personnel Only</p>
                                      <p>📅 Retrieved: {new Date().toLocaleDateString('en-US', {
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
              <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-growth-green to-legacy-green rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-sage px-4 py-3 rounded-xl shadow-md border border-wash-green">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-growth-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-growth-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-growth-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-rush-gray p-6 bg-ivory">
            <form onSubmit={sendMessage} className="flex space-x-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about Rush policies..."
                className="flex-1 border-2 border-wash-green rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-growth-green focus:border-growth-green transition-all duration-200 bg-white text-rush-black placeholder-wash-gray"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">{isLoading ? 'Sending...' : 'Send'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-4 py-6 text-center text-sm text-raw-umber border-t border-rush-gray">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center space-x-2">
          <Shield className="w-4 h-4 text-vitality-green" />
          <span>Secured with Azure enterprise-grade encryption • Rush credentials required</span>
        </div>
      </footer>
    </div>
  );
}