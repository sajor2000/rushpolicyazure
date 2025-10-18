/**
 * Message Bubble Component
 *
 * Displays individual messages in the chat interface with
 * proper styling for user and bot messages, including
 * PDF-style document rendering for policy responses.
 */

'use client';
import React from 'react';
import { User, FileText, Copy, CheckCheck, AlertCircle } from 'lucide-react';
import { formatDocumentContent, parseDocumentMetadata, parseAnswerAndDocument } from '../utils/documentFormatter';
import PolicyResponse from './PolicyResponse';

/**
 * Message Bubble Component
 * @param {Object} props - Component props
 * @param {Object} props.message - Message object
 * @param {string} props.message.type - Message type ('user', 'bot', or 'error')
 * @param {string} props.message.content - Message content
 * @param {Date} props.message.timestamp - Message timestamp
 * @param {number} props.index - Message index
 * @param {boolean} props.isCopied - Whether this message is currently copied
 * @param {Function} props.onCopy - Callback when copy button is clicked
 * @returns {React.Element} Message bubble component
 */
export default function MessageBubble({ message, index, isCopied, onCopy }) {
  const isUser = message.type === 'user';
  const isError = message.type === 'error';

  // User message bubble
  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in-up">
        <div className="flex items-start space-x-3 max-w-3xl">
          <div className="bg-gradient-to-br from-legacy to-growth px-6 py-4 rounded-2xl shadow-md border border-vitality/40">
            <p className="text-white font-medium">{message.content}</p>
          </div>
          <div className="w-10 h-10 bg-sage/40 rounded-xl flex items-center justify-center flex-shrink-0 border border-growth/30">
            <User className="w-5 h-5 text-legacy" />
          </div>
        </div>
      </div>
    );
  }

  // Error message bubble
  if (isError) {
    return (
      <div className="flex justify-start animate-fade-in-up">
        <div className="flex items-start space-x-3 max-w-4xl">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="bg-red-50 px-6 py-4 rounded-2xl shadow-md border border-red-200 flex-1">
            <p className="text-red-700">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  // Bot message bubble (policy document with answer-first format)
  const { answer, fullDocument, hasAnswer } = parseAnswerAndDocument(message.content);

  return (
    <div className="flex justify-start animate-fade-in-up">
      <div className="flex items-start space-x-3 max-w-full w-full">
        <div className="w-10 h-10 bg-gradient-to-br from-growth to-legacy rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border border-vitality/40">
          <FileText className="w-5 h-5 text-white" />
        </div>

        {/* Policy Response with Answer First, then Expandable Document */}
        <div className="flex-1">
          {hasAnswer ? (
            <PolicyResponse
              answer={answer}
              fullDocument={fullDocument}
              index={index}
              isCopied={isCopied}
              onCopy={onCopy}
              timestamp={message.timestamp}
            />
          ) : (
            // Fallback to original format if no answer section detected
            <div className="pdf-container">
              <div className="pdf-document">
                <div className="pdf-header">
                  <button
                    onClick={() => onCopy(message.content, index)}
                    className="btn-secondary flex items-center space-x-2 text-sm px-3 py-2 mb-3"
                    aria-label="Copy document to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <CheckCheck className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="pdf-body">{formatDocumentContent(message.content)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
