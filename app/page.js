'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, AlertCircle, Shield } from 'lucide-react';

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
          <h2 key={index} className="text-lg font-bold text-gray-900 mb-3 mt-6 first:mt-0 border-b border-gray-300 pb-2">
            {trimmedLine}
          </h2>
        );
      }
      // Numbered sections (1., 2., 3., etc.)
      else if (/^\d+\./.test(trimmedLine)) {
        formatted.push(
          <div key={index} className="mb-3">
            <h3 className="font-semibold text-gray-800 mb-2">{trimmedLine}</h3>
          </div>
        );
      }
      // Lettered subsections (a., b., c., etc.)
      else if (/^[a-z]\./i.test(trimmedLine)) {
        formatted.push(
          <div key={index} className="ml-4 mb-2">
            <p className="text-gray-700">{trimmedLine}</p>
          </div>
        );
      }
      // Bullet points or dashes
      else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        formatted.push(
          <div key={index} className="ml-6 mb-2 flex">
            <span className="mr-2 text-[#006341]">•</span>
            <p className="text-gray-700 flex-1">{trimmedLine.substring(1).trim()}</p>
          </div>
        );
      }
      // Regular paragraphs
      else {
        formatted.push(
          <p key={index} className="mb-3 text-gray-700 leading-relaxed">
            {trimmedLine}
          </p>
        );
      }
    });

    return formatted;
  };

  const sendMessage = async () => {
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

      const data = await response.json();

      // Add bot response
      setMessages(prev => [...prev, { type: 'bot', content: data.response }]);
    } catch (error) {
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
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#006341] rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Welcome to Rush Policy Assistant</h1>
            <p className="mt-2 text-gray-600 max-w-2xl">
              I&apos;m here to help you find and understand Rush University policies, procedures, and guidelines. 
              I have access to over 800 official policy documents to assist you.
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-4xl mx-auto w-full px-4 mt-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-center text-red-800 font-medium">
            BETA DEMO DISCLAIMER: This is a demonstration version built by Dr. Juan C. Rojas 
            using secure Azure resources. For demo purposes only - not for production use 
            without proper IT approval. All responses are logged for security purposes.
          </p>
        </div>

        <div className="mt-4 flex items-start space-x-2 text-gray-600">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">
            Responses are AI-generated from official policy documents. Please verify critical information 
            with your department head or the policy owner listed in the source documents.
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg h-[500px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Start by asking about any Rush policy</p>
                <p className="text-sm mt-2">Example: &quot;What is the vacation policy?&quot; or &quot;Tell me about HIPAA requirements&quot;</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'user' ? (
                    <div
                      className={`max-w-3xl px-4 py-3 rounded-lg bg-[#006341] text-white`}
                    >
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="flex space-x-3 justify-start">
                      <div className="w-8 h-8 bg-[#006341] rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 bg-white rounded-lg shadow-sm border document-style">
                        {/* Document Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-[#006341]" />
                            <h3 className="font-semibold text-gray-900">Rush University Policy Document</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Retrieved from official policy database</p>
                        </div>

                        {/* Document Content */}
                        <div className="p-6">
                          <div className="document-content">
                            {formatDocumentContent(message.content)}
                          </div>

                          {/* Document Footer */}
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="text-xs text-gray-500 space-y-1">
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
                <div className="bg-gray-100 px-4 py-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="text-center text-sm text-gray-500 mb-3">Policy Assistant Mode</div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your policy question here..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006341] focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="px-4 py-3 bg-[#006341] text-white rounded-lg hover:bg-[#004d30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Shield className="w-4 h-4 text-green-600" />
          <span>Beta Demo: Secured with Azure enterprise-grade encryption and access controls</span>
        </div>
      </div>
    </div>
  );
}