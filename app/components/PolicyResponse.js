/**
 * Policy Response Component
 *
 * Displays policy responses with a two-part structure:
 * 1. Quick Answer (prominent, always visible)
 * 2. Full Policy Document (expandable, collapsed by default)
 *
 * Provides enhanced UX with clear visual hierarchy.
 */

'use client';
import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Lightbulb, Copy, CheckCheck } from 'lucide-react';
import { formatDocumentContent, parseDocumentMetadata } from '../utils/documentFormatter';

/**
 * Policy Response Component
 * @param {Object} props - Component props
 * @param {string} props.answer - Quick answer text
 * @param {string} props.fullDocument - Complete policy document
 * @param {number} props.index - Message index for copy functionality
 * @param {boolean} props.isCopied - Whether content is copied
 * @param {Function} props.onCopy - Copy callback
 * @param {Date} props.timestamp - Response timestamp
 * @returns {React.Element} Policy response component
 */
export default function PolicyResponse({ answer, fullDocument, index, isCopied, onCopy, timestamp }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const metadata = parseDocumentMetadata(fullDocument);

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Quick Answer Card */}
      {answer && (
        <div className="quick-answer-card">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-growth/20 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-growth" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-legacy mb-2 flex items-center space-x-2">
                <span>Quick Answer</span>
              </h3>
              <p className="text-rush-black leading-relaxed whitespace-pre-wrap">
                {answer}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Full Document Section */}
      <div className="border border-rush-gray/20 rounded-lg overflow-hidden bg-white shadow-sm">
        {/* Document Header / Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 bg-sage/10 hover:bg-sage/20 transition-colors flex items-center justify-between group"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Hide complete policy document' : 'View complete policy document'}
        >
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-legacy" />
            <div className="text-left">
              <h4 className="text-sm font-semibold text-legacy">
                {metadata.policyTitle || 'Complete Policy Document'}
              </h4>
              {metadata.policyNumber && (
                <p className="text-xs text-rush-black/60 mt-0.5">
                  Policy #{metadata.policyNumber}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-rush-black/70 group-hover:text-legacy transition-colors">
              {isExpanded ? 'Hide Document' : 'View Document'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-legacy" />
            ) : (
              <ChevronDown className="w-5 h-5 text-legacy" />
            )}
          </div>
        </button>

        {/* Expandable Document Content */}
        <div
          className={`document-expander ${isExpanded ? 'expanded' : 'collapsed'}`}
          style={{
            maxHeight: isExpanded ? '100000px' : '0',
            transition: 'max-height 0.4s ease-out',
          }}
        >
          <div className="pdf-document border-t border-rush-gray/10">
            {/* Document Actions Bar */}
            <div className="pdf-header bg-white border-b border-rush-gray/20 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-rush-black/60">
                {metadata.effectiveDate && (
                  <span className="px-2 py-1 bg-sage/20 rounded">
                    📅 {metadata.effectiveDate}
                  </span>
                )}
                {metadata.department && (
                  <span className="px-2 py-1 bg-sage/20 rounded">
                    🏢 {metadata.department}
                  </span>
                )}
              </div>
              <button
                onClick={() => onCopy(fullDocument, index)}
                className="btn-secondary flex items-center space-x-2 text-sm px-3 py-1.5"
                aria-label="Copy complete document to clipboard"
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

            {/* Document Body */}
            <div className="pdf-body px-6 py-5">
              {formatDocumentContent(fullDocument)}
            </div>

            {/* Document Footer */}
            <div className="pdf-footer px-6 py-4 bg-sage/5 border-t border-rush-gray/10">
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
                    {timestamp?.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div>
                    <span className="font-semibold">Property of:</span> Rush University System for Health
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
