'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, AlertCircle, Shield, Loader2, User } from 'lucide-react';

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

  // Format content to look like a policy document
  const formatDocumentContent = (content) => {
    const lines = content.split('\n');
    const formatted = [];
    let currentSection = null;

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
        content: 'I apologize, but I\'m having trouble connecting to the policy database. Please try again later.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-rush-gray">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-growth-green to-legacy-green rounded-xl flex items-center justify-center mb-4 shadow-md">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-rush-black">Welcome to Rush Policy Assistant</h1>
            <p className="mt-2 text-raw-umber max-w-2xl">
              I&apos;m here to help you find and understand Rush University policies, procedures, and guidelines.
              I have access to over 800 official policy documents to assist you.
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-4xl mx-auto w-full px-4 mt-6">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="text-center text-rose-800 font-medium text-sm leading-relaxed">
            BETA DEMO DISCLAIMER: This is a demonstration version built by Dr. Juan C. Rojas
            using secure Azure resources. For demo purposes only - not for production use
            without proper IT approval.
          </p>
        </div>

        <div className="mt-4 flex items-start space-x-2 text-sm text-gray-600">
          <Shield className="w-5 h-5 mt-0.5 flex-shrink-0 text-vitality-green" />
          <p className="text-raw-umber">
            Responses are AI-generated from official policy documents. Please verify critical information
            with your department head or the policy owner listed in the source documents.
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-rush-gray h-full max-h-[600px] flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="border-b border-rush-gray p-6 bg-gradient-to-r from-sage to-ivory">
            <h2 className="text-xl font-semibold text-rush-black mb-1">Policy Assistant Chat</h2>
            <p className="text-sm text-raw-umber">Ask me anything about Rush University policies</p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold text-rush-black">Start by asking about any Rush policy</p>
                <p className="text-sm mt-2 text-raw-umber">Example: &quot;What is the vacation policy?&quot; or &quot;Tell me about HIPAA requirements&quot;</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'user' ? (
                    <div className="flex items-start space-x-4 justify-end">
                      <div className="bg-gradient-to-r from-cerulean-blue to-deep-blue rounded-xl px-5 py-4 max-w-md shadow-md">
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
                      <div className="flex-1 bg-white rounded-xl shadow-md border border-wash-green document-style overflow-hidden">
                        {/* Document Header */}
                        <div className="bg-sage px-6 py-4 border-b border-wash-green">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-growth-green" />
                            <h3 className="font-semibold text-rush-black">Rush University Policy Document</h3>
                          </div>
                          <p className="text-sm text-raw-umber mt-1">Retrieved from official policy database</p>
                        </div>

                        {/* Document Content */}
                        <div className="p-6">
                          <div className="document-content">
                            {formatDocumentContent(message.content)}
                          </div>

                          {/* Document Footer */}
                          <div className="mt-6 pt-4 border-t border-wash-green">
                            <div className="text-xs text-wash-gray space-y-1">
                              <p>📄 Source: Rush University Official Policy Database</p>
                              <p>🔒 Access Level: Authorized Personnel Only</p>
                              <p>📅 Retrieved: {new Date().toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
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
          <span>Beta Demo: Secured with Azure enterprise-grade encryption and access controls</span>
        </div>
      </footer>
    </div>
  );
}