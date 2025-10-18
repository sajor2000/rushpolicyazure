import React, { useState, useEffect } from 'react';
import { FileText, Copy, CheckCheck, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { parseDocumentMetadata, formatDocumentContent } from '../utils/documentFormatter';

/**
 * StreamingMessage component for displaying AI responses in real-time
 * Supports progressive rendering with typewriter effect
 *
 * @param {string} answer - The quick answer text (streaming or complete)
 * @param {string} fullDocument - The full policy document (streaming or complete)
 * @param {boolean} isStreamingAnswer - Whether answer is currently streaming
 * @param {boolean} isStreamingDocument - Whether document is currently streaming
 * @param {number} answerProgress - Progress percentage for answer (0-100)
 * @param {number} documentProgress - Progress percentage for document (0-100)
 * @param {number} index - Message index for copy functionality
 * @param {Function} onCopy - Callback when content is copied
 * @param {Object} isCopied - Copy status object
 * @param {string} timestamp - Message timestamp
 */
export default function StreamingMessage({
  answer,
  fullDocument,
  isStreamingAnswer = false,
  isStreamingDocument = false,
  answerProgress = 0,
  documentProgress = 0,
  index,
  onCopy,
  isCopied,
  timestamp
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const metadata = parseDocumentMetadata(fullDocument || '');

  // Blinking cursor effect while streaming
  useEffect(() => {
    if (isStreamingAnswer || isStreamingDocument) {
      const interval = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setShowCursor(false);
    }
  }, [isStreamingAnswer, isStreamingDocument]);

  const copyAnswer = () => {
    if (onCopy && answer) {
      onCopy(answer, `answer-${index}`);
    }
  };

  const copyDocument = () => {
    if (onCopy && fullDocument) {
      onCopy(fullDocument, `document-${index}`);
    }
  };

  return (
    <div className="flex justify-start animate-fade-in-up">
      <div className="flex items-start space-x-3 max-w-full w-full">
        {/* Bot Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-growth to-legacy rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Quick Answer Card */}
          {answer && (
            <div className="quick-answer-card mb-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-growth/20 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-growth" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-legacy">Quick Answer</h3>
                    <button
                      onClick={copyAnswer}
                      className="text-rush-gray hover:text-legacy transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-growth"
                      aria-label="Copy answer"
                    >
                      {isCopied && isCopied[`answer-${index}`] ? (
                        <CheckCheck className="w-4 h-4 text-growth" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-rush-black leading-relaxed whitespace-pre-wrap">
                    {answer}
                    {isStreamingAnswer && showCursor && (
                      <span className="inline-block w-0.5 h-5 bg-growth ml-0.5 animate-pulse" />
                    )}
                  </p>

                  {/* Progress bar while streaming answer */}
                  {isStreamingAnswer && answerProgress > 0 && answerProgress < 100 && (
                    <div className="mt-3">
                      <div className="h-1 w-full bg-rush-gray/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-growth transition-all duration-300 ease-out"
                          style={{ width: `${answerProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-rush-gray mt-1">Streaming... {answerProgress}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Full Policy Document (Expandable) */}
          {fullDocument && (
            <div className="border border-rush-gray/20 rounded-lg overflow-hidden bg-white shadow-sm">
              {/* Document Header (Always Visible) */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 bg-sage/10 hover:bg-sage/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-growth focus:ring-inset"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Collapse full document" : "Expand full document"}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-left flex-1">
                    <FileText className="w-5 h-5 text-legacy flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-legacy line-clamp-1">
                        {metadata.title || 'Full Policy Document'}
                      </p>
                      {metadata.policyNumber && (
                        <p className="text-xs text-rush-gray mt-0.5">
                          Policy {metadata.policyNumber}
                          {metadata.effectiveDate && ` • Effective ${metadata.effectiveDate}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                    {!isExpanded && !isStreamingDocument && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyDocument();
                        }}
                        className="text-rush-gray hover:text-legacy transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-growth"
                        aria-label="Copy document"
                      >
                        {isCopied && isCopied[`document-${index}`] ? (
                          <CheckCheck className="w-4 h-4 text-growth" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-legacy" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-legacy" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expandable Document Content */}
              <div
                className={`document-expander ${isExpanded ? 'expanded' : 'collapsed'}`}
                style={{
                  maxHeight: isExpanded ? '2000px' : '0px',
                  transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div className="px-6 py-4 bg-white border-t border-rush-gray/10">
                  {/* Copy button when expanded */}
                  {isExpanded && !isStreamingDocument && (
                    <div className="flex justify-end mb-3">
                      <button
                        onClick={copyDocument}
                        className="text-sm text-rush-gray hover:text-legacy transition-colors inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg hover:bg-sage/10 focus:outline-none focus:ring-2 focus:ring-growth"
                        aria-label="Copy full document"
                      >
                        {isCopied && isCopied[`document-${index}`] ? (
                          <>
                            <CheckCheck className="w-4 h-4 text-growth" />
                            <span className="text-growth">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Document</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Document Content with PolicyTech Formatting */}
                  <div className="policytech-document space-y-2">
                    {formatDocumentContent(fullDocument).map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}

                    {/* Cursor while streaming document */}
                    {isStreamingDocument && showCursor && (
                      <span className="inline-block w-0.5 h-5 bg-legacy ml-0.5 animate-pulse" />
                    )}
                  </div>

                  {/* Progress bar while streaming document */}
                  {isStreamingDocument && documentProgress > 0 && documentProgress < 100 && (
                    <div className="mt-4">
                      <div className="h-1 w-full bg-rush-gray/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-legacy transition-all duration-300 ease-out"
                          style={{ width: `${documentProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-rush-gray mt-1">Loading document... {documentProgress}%</p>
                    </div>
                  )}

                  {/* Timestamp */}
                  {timestamp && (
                    <p className="text-xs text-rush-gray/60 mt-4 pt-3 border-t border-rush-gray/10">
                      {timestamp}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
