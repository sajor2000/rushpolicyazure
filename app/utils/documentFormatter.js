/**
 * Document Formatting Utility
 *
 * Handles the formatting of PolicyTech documents into React components
 * with professional typography and Rush brand styling.
 * Also handles parsing of answer + document format for improved UX.
 */

import React from 'react';

/**
 * Parse response into quick answer and full document sections
 * @param {string} content - The full response content
 * @returns {Object} Object with answer and fullDocument properties
 */
export function parseAnswerAndDocument(content) {
  if (!content || typeof content !== 'string') {
    return { answer: null, fullDocument: content };
  }

  // Try to extract ANSWER and FULL_POLICY_DOCUMENT sections
  const answerMatch = content.match(/ANSWER:\s*([\s\S]*?)(?=FULL_POLICY_DOCUMENT:|$)/i);
  const documentMatch = content.match(/FULL_POLICY_DOCUMENT:\s*([\s\S]*)/i);

  const answer = answerMatch ? answerMatch[1].trim() : null;
  const fullDocument = documentMatch ? documentMatch[1].trim() : content;

  return {
    answer,
    fullDocument,
    hasAnswer: Boolean(answer),
  };
}

/**
 * Parse policy document metadata from content
 * @param {string} content - The full document content
 * @returns {Object} Parsed metadata including policy number, title, dates, department
 */
export function parseDocumentMetadata(content) {
  const policyNumberMatch = content.match(/(?:Policy\s*(?:Number|#)?|Reference\s*Number)\s*:?\s*([A-Z0-9\-]+)/i);
  const titleMatch = content.match(/(?:Policy\s*Title)\s*:?\s*([^\n]+)/i);
  const effectiveDateMatch = content.match(/(?:Effective\s*Date|Date\s*Approved)\s*:?\s*([^\n]+)/i);
  const departmentMatch = content.match(/(?:Department|Applies\s*To|Document\s*Owner)\s*:?\s*([^\n]+)/i);

  return {
    policyNumber: policyNumberMatch ? policyNumberMatch[1].trim() : null,
    policyTitle: titleMatch ? titleMatch[1].trim() : null,
    effectiveDate: effectiveDateMatch ? effectiveDateMatch[1].trim() : null,
    department: departmentMatch ? departmentMatch[1].trim() : null,
  };
}

/**
 * Format a single line of document content into appropriate React component
 * @param {string} line - The line to format
 * @param {number} index - Line index for React key
 * @returns {React.Element} Formatted line component
 */
function formatLine(line, index) {
  const trimmedLine = line.trim();

  // Skip empty lines but preserve spacing
  if (!trimmedLine) {
    return <div key={`space-${index}`} className="h-4"></div>;
  }

  // Major section headers (### style or Section:)
  if (trimmedLine.startsWith('###') || trimmedLine.match(/^(POLICY|SECTION|PROCEDURE|DEFINITIONS?|REFERENCES?|SCOPE|PURPOSE)/i)) {
    const headerText = trimmedLine.replace(/^###\s*/, '').replace(/^📋\s*/, '');
    return (
      <h2 key={index} className="pdf-section-header">
        {headerText}
      </h2>
    );
  }

  // Subsection headers (** style or bold indicators)
  if (trimmedLine.startsWith('**') || trimmedLine.match(/^[IVX]+\.\s/) || trimmedLine.match(/^\d+\.\s[A-Z]/)) {
    const headerText = trimmedLine.replace(/^\*\*/, '').replace(/\*\*$/, '');
    return (
      <h3 key={index} className="pdf-subsection-header">
        {headerText}
      </h3>
    );
  }

  // Metadata lines (key: value format)
  if (trimmedLine.includes(':') && trimmedLine.length < 100 && !trimmedLine.match(/^[a-z]/)) {
    const [key, ...valueParts] = trimmedLine.split(':');
    const value = valueParts.join(':').trim();
    return (
      <div key={index} className="pdf-metadata-line">
        <span className="pdf-metadata-key">{key}:</span>
        <span className="pdf-metadata-value">{value}</span>
      </div>
    );
  }

  // Bulleted list items
  if (trimmedLine.match(/^[•\-\*]\s/) || trimmedLine.match(/^[☒☐]\s/)) {
    const text = trimmedLine.replace(/^[•\-\*☒☐]\s*/, '');
    const isChecked = trimmedLine.startsWith('☒');
    return (
      <div key={index} className="pdf-list-item">
        <span className="pdf-bullet">{isChecked ? '☑' : '•'}</span>
        <span>{text}</span>
      </div>
    );
  }

  // Numbered list items (a., i., 1., etc.)
  if (trimmedLine.match(/^[a-z]\.\s/) || trimmedLine.match(/^[ivx]+\.\s/) || trimmedLine.match(/^\d+\.\s/)) {
    return (
      <div key={index} className="pdf-numbered-item">
        {trimmedLine}
      </div>
    );
  }

  // Quoted or highlighted text (>)
  if (trimmedLine.startsWith('>')) {
    const text = trimmedLine.replace(/^>\s*/, '');
    return (
      <blockquote key={index} className="pdf-blockquote">
        {text}
      </blockquote>
    );
  }

  // Separator lines (---, ===)
  if (trimmedLine.match(/^[-=━]{3,}$/)) {
    return <hr key={index} className="pdf-separator" />;
  }

  // Warning/Note indicators
  if (trimmedLine.match(/^⚠️|^💡|^ℹ️|^NOTE:|^WARNING:/i)) {
    return (
      <div key={index} className="pdf-notice">
        {trimmedLine}
      </div>
    );
  }

  // Regular paragraph text
  return (
    <p key={index} className="pdf-paragraph">
      {trimmedLine}
    </p>
  );
}

/**
 * Format complete document content with PolicyTech PDF styling
 * @param {string} content - The full document content
 * @returns {Array<React.Element>} Array of formatted React components
 */
export function formatDocumentContent(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const lines = content.split('\n');
  return lines.map((line, index) => formatLine(line, index));
}
