import React from 'react';
import {
  User,
  FileText,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  BookOpen,
  Copy,
  CheckCheck,
  Clock,
  Building2
} from 'lucide-react';

/**
 * MessageItem Component
 *
 * Renders a single message in the chat (user, bot, or error)
 * Handles all three message types with appropriate styling and formatting
 */
export default function MessageItem({
  message,
  index,
  parseResponse,
  formatDocumentContent,
  copyToClipboard,
  copiedIndex,
  generateKey
}) {
  // User message
  if (message.type === 'user') {
    return (
      <div className="flex items-start space-x-3 justify-end max-w-2xl">
        <div className="bg-gradient-to-br from-navy to-purple rounded-2xl px-5 py-4 shadow-lg hover:shadow-xl transition-shadow border border-navy/20">
          <p className="text-white font-medium voice-inclusive">{message.content}</p>
          <p className="text-white/90 text-xs mt-2 font-georgia">
            {message.timestamp?.toLocaleTimeString()}
          </p>
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-navy to-purple rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border border-violet/30">
          <User className="w-5 h-5 text-white" />
        </div>
      </div>
    );
  }

  // Error message
  if (message.type === 'error') {
    return (
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
            <p className="text-red-900 leading-relaxed voice-accessible font-georgia">
              {message.content}
            </p>
            <p className="text-red-700 text-xs mt-2">
              {message.timestamp?.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Bot response (answer + document)
  const { answer, fullDocument, metadata } = parseResponse(message.content);

  return (
    <div className="flex items-start space-x-3 w-full max-w-4xl">
      <div className="w-10 h-10 bg-gradient-to-br from-growth to-legacy rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
        <FileText className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 space-y-4">
        {/* Answer Section - PART 1 */}
        {answer && (
          <div className="answer-section">
            <div className="answer-header">
              <MessageSquare className="w-5 h-5 text-growth" />
              <h3>Answer</h3>
            </div>
            <div className="answer-content">
              <p className="voice-inclusive font-georgia leading-relaxed">{answer}</p>
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={() => copyToClipboard(answer, `answer-${index}`)}
                className="answer-copy-button-inline"
                disabled={copiedIndex === `answer-${index}`}
                aria-label={
                  copiedIndex === `answer-${index}`
                    ? 'Answer copied to clipboard'
                    : 'Copy answer to clipboard'
                }
                aria-live="polite"
              >
                {copiedIndex === `answer-${index}` ? (
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
          </div>
        )}

        {/* Source Document Evidence Section - PART 2 */}
        {fullDocument && fullDocument.length > 0 && (
          <div className="evidence-section">
            <div className="evidence-header">
              <BookOpen className="w-5 h-5 text-legacy" />
              <h3>Source Document Evidence</h3>
            </div>

            <div className="pdf-document-container">
              {/* PDF Document Header */}
              <div className="pdf-header">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src="/images/rush-logo.jpg"
                      alt="Rush"
                      className="h-8 object-contain"
                    />
                    <div className="border-l border-rush-gray h-8"></div>
                    <div>
                      <h4 className="font-semibold text-legacy text-lg">
                        Rush University Policy Document
                      </h4>
                      <p className="text-xs text-rush-black/70">PolicyTech Database</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(fullDocument, `doc-${index}`)}
                    className="pdf-copy-button"
                    disabled={copiedIndex === `doc-${index}`}
                    aria-label={
                      copiedIndex === `doc-${index}`
                        ? 'Document copied to clipboard'
                        : 'Copy full document to clipboard'
                    }
                    aria-live="polite"
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
                {(metadata.policyNumber ||
                  metadata.policyTitle ||
                  metadata.effectiveDate ||
                  metadata.department) && (
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
              <div className="pdf-body">{formatDocumentContent(fullDocument)}</div>

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
                      <span className="font-semibold">Retrieved:</span>{' '}
                      {message.timestamp?.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div>
                      <span className="font-semibold">Property of:</span> Rush University System
                      for Health
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
