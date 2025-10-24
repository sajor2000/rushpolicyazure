/**
 * Document Formatting Utility
 *
 * Handles the formatting of PolicyTech documents into React components
 * with professional typography and Rush brand styling.
 * Enhanced version with full metadata header parsing and PDF-style rendering.
 */

import React from 'react';
import { PERFORMANCE } from '../constants';

/**
 * Parse policy metadata header into structured object
 * Enhanced to handle Rush policy table-based layouts with multi-column format
 *
 * @param {Array<string>} lines - Array of header lines to parse
 * @returns {Object} Parsed metadata with all policy fields
 */
export function parseMetadataHeader(lines) {
  // Safety limit to prevent performance issues with large documents
  const safeLines = lines.slice(0, PERFORMANCE.MAX_METADATA_LINES);

  const metadata = {
    institution: 'Rush University System for Health',
    policyTitle: '',
    policyNumber: '',
    referenceNumber: '',
    documentOwner: '',
    approver: '',
    dateCreated: '',
    dateApproved: '',
    dateUpdated: '',
    reviewDue: '',
    appliesTo: '',
    notice: 'Printed copies are for reference only. Please refer to the electronic copy for the latest version'
  };

  // Join lines into single text block for better multi-column table parsing
  const headerText = safeLines.join('\n');

  // Enhanced extraction patterns for table-based layout
  // Patterns match: "Label: Value" where Value ends at pipe "|", newline, or another Label
  const extractors = {
    // Policy Title - capture until Policy Number or pipe or newline
    policyTitle: /Policy Title:\s*([^\n|]+?)(?:\s*\||Policy Number:|\n|$)/i,

    // Policy Number - capture until next field or line end
    policyNumber: /Policy Number:\s*([^\n|]+?)(?:\s*\||\n|Document Owner:|$)/i,

    // Reference Number (alternative to Policy Number in some documents)
    referenceNumber: /Reference Number:\s*([^\n|]+?)(?:\s*\||\n|$)/i,

    // Document Owner - capture until Approver or pipe or newline
    documentOwner: /Document Owner:\s*([^\n|]+?)(?:\s*\||Approver|\n|$)/i,

    // Approver - capture until next field or line end
    approver: /Approver\(s\)?:\s*([^\n|]+?)(?:\s*\||\n|Date Created:|$)/i,

    // Date fields - capture until next field or pipe or newline
    dateCreated: /Date Created:\s*([^\n|]+?)(?:\s*\||Date Approved:|\n|$)/i,
    dateApproved: /Date Approved:\s*([^\n|]+?)(?:\s*\||Date Updated:|\n|$)/i,
    dateUpdated: /Date Updated:\s*([^\n|]+?)(?:\s*\||Review Due:|\n|$)/i,
    reviewDue: /Review Due:\s*([^\n|]+?)(?:\s*\||\n|Applies To:|$)/i,

    // Applies To - often contains checkboxes, capture entire line
    appliesTo: /Applies To:\s*([^\n]+?)(?:\n|Printed copies|$)/i,

    // Notice - the standard disclaimer
    notice: /(Printed copies are for reference only[^\n]*)/i
  };

  // Apply extractors to header text
  for (const [key, pattern] of Object.entries(extractors)) {
    const match = headerText.match(pattern);
    if (match && match[1]) {
      let value = match[1].trim();

      // Clean up the extracted value
      value = value
        .replace(/☒/g, '✓')          // Normalize checkboxes to checkmarks
        .replace(/☐/g, '○')          // Empty checkboxes to circles
        .replace(/\*\*/g, '')        // Remove markdown bold
        .replace(/\s+/g, ' ')        // Normalize whitespace
        .replace(/\|\s*$/,'')        // Remove trailing pipes
        .trim();

      metadata[key] = value;
    }
  }

  // Post-processing: Handle special cases
  // If policyNumber is empty but referenceNumber exists, use it
  if (!metadata.policyNumber && metadata.referenceNumber) {
    metadata.policyNumber = metadata.referenceNumber;
  }

  // Ensure all values are strings, use 'Not specified' for empty required fields
  Object.keys(metadata).forEach(key => {
    if (!metadata[key] || metadata[key] === 'Not Set' || metadata[key] === '') {
      // Keep institution and notice defaults, mark others as not specified
      if (key !== 'institution' && key !== 'notice') {
        metadata[key] = 'Not specified';
      }
    }
  });

  return metadata;
}

/**
 * Format complete policy document content with PDF-style professional typography
 * Includes Rush metadata header box, section headers, lists, and formatted content
 *
 * @param {string} content - The full document content
 * @returns {Array<React.Element>} Array of formatted React components
 */
export function formatDocumentContent(content) {
  const lines = content.split('\n');
  const formatted = [];
  let currentSection = null;
  let inMetadataHeader = false;
  let metadataLines = [];
  let lastLineWasEmpty = false;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip consecutive blank lines to reduce excessive whitespace
    if (!trimmedLine) {
      if (lastLineWasEmpty) {
        return; // Skip consecutive blank line
      }
      lastLineWasEmpty = true;
    } else {
      lastLineWasEmpty = false;
    }

    // Detect start of metadata header
    if (trimmedLine.includes('RUSH UNIVERSITY') && index < 5) {
      inMetadataHeader = true;
      metadataLines = [];
    }

    // Collect metadata lines
    if (inMetadataHeader) {
      metadataLines.push(line);

      // End of metadata header (separator line or section start)
      if (trimmedLine.match(/^━+$/) || trimmedLine.match(/^[IVX]+\.\s/) ||
          (trimmedLine.match(/^NOTE:/i) && metadataLines.length > 5)) {
        inMetadataHeader = false;

        // Parse and render metadata box - PDF Table Format
        const metadata = parseMetadataHeader(metadataLines);
        formatted.push(
          <div key="metadata-box" className="policy-metadata-box">
            {/* Rush Logo Header */}
            <div className="metadata-header-row">
              <img src="/images/rush-logo.jpg" alt="Rush University System for Health" className="metadata-logo" />
            </div>

            {/* Metadata Table */}
            <table className="metadata-table">
              <tbody>
                {/* Row 1: Policy Title and Policy Number */}
                <tr>
                  <td className="metadata-cell metadata-cell-wide">
                    <div className="metadata-label">Policy Title:</div>
                    <div className="metadata-value">{metadata.policyTitle || '\u00A0'}</div>
                  </td>
                  <td className="metadata-cell">
                    <div className="metadata-label">Policy Number:</div>
                    <div className="metadata-value">{metadata.policyNumber || '\u00A0'}</div>
                  </td>
                </tr>

                {/* Row 2: Document Owner and Approver */}
                <tr>
                  <td className="metadata-cell">
                    <div className="metadata-label">Document Owner:</div>
                    <div className="metadata-value">{metadata.documentOwner || '\u00A0'}</div>
                  </td>
                  <td className="metadata-cell">
                    <div className="metadata-label">Approver(s):</div>
                    <div className="metadata-value">{metadata.approver || '\u00A0'}</div>
                  </td>
                </tr>

                {/* Row 3: Dates */}
                <tr>
                  <td className="metadata-cell-date">
                    <div className="metadata-label">Date Created:</div>
                    <div className="metadata-value">{metadata.dateCreated || 'Not Set'}</div>
                  </td>
                  <td className="metadata-cell-date">
                    <div className="metadata-label">Date Approved:</div>
                    <div className="metadata-value">{metadata.dateApproved || '\u00A0'}</div>
                  </td>
                  <td className="metadata-cell-date">
                    <div className="metadata-label">Date Updated:</div>
                    <div className="metadata-value">{metadata.dateUpdated || '\u00A0'}</div>
                  </td>
                  <td className="metadata-cell-date metadata-cell-last">
                    <div className="metadata-label">Review Due:</div>
                    <div className="metadata-value">{metadata.reviewDue || '\u00A0'}</div>
                  </td>
                </tr>

                {/* Row 4: Applies To */}
                <tr>
                  <td colSpan="4" className="metadata-applies-to">
                    <span className="font-semibold">Applies To:</span> {metadata.appliesTo || 'Not specified'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Warning Notice */}
            <div className="metadata-notice">{metadata.notice}</div>
          </div>
        );

        metadataLines = [];
        return;
      }
      return; // Skip individual metadata line rendering
    }

    // Skip empty lines but preserve minimal spacing (reduced from h-4 to h-2)
    if (!trimmedLine) {
      formatted.push(<div key={`empty-${index}`} className="h-2"></div>);
      return;
    }

    // Major section headers (### style or Section:)
    if (trimmedLine.startsWith('###') || trimmedLine.match(/^(POLICY|SECTION|PROCEDURE|DEFINITIONS?|REFERENCES?|SCOPE|PURPOSE)/i)) {
      const headerText = trimmedLine.replace(/^###\s*/, '').replace(/^📋\s*/, '');
      formatted.push(
        <h2 key={`header-${index}`} className="pdf-section-header">
          {headerText}
        </h2>
      );
    }
    // Subsection headers (** style or bold indicators)
    else if (trimmedLine.startsWith('**') || trimmedLine.match(/^[IVX]+\.\s/) || trimmedLine.match(/^\d+\.\s[A-Z]/)) {
      const headerText = trimmedLine.replace(/^\*\*/, '').replace(/\*\*$/, '');
      formatted.push(
        <h3 key={`subheader-${index}`} className="pdf-subsection-header">
          {headerText}
        </h3>
      );
    }
    // Metadata lines (key: value format)
    else if (trimmedLine.includes(':') && trimmedLine.length < 100 && !trimmedLine.match(/^[a-z]/)) {
      const [key, ...valueParts] = trimmedLine.split(':');
      const value = valueParts.join(':').trim();
      formatted.push(
        <div key={`metadata-${index}`} className="pdf-metadata-line">
          <span className="pdf-metadata-key">{key}:</span>
          <span className="pdf-metadata-value">{value}</span>
        </div>
      );
    }
    // Bulleted list items
    else if (trimmedLine.match(/^[•\-\*]\s/) || trimmedLine.match(/^[☒☐]\s/)) {
      const text = trimmedLine.replace(/^[•\-\*☒☐]\s*/, '');
      const isChecked = trimmedLine.startsWith('☒');
      formatted.push(
        <div key={`bullet-${index}`} className="pdf-list-item">
          <span className="pdf-bullet">{isChecked ? '☑' : '•'}</span>
          <span>{text}</span>
        </div>
      );
    }
    // Numbered list items (a., i., 1., etc.)
    else if (trimmedLine.match(/^[a-z]\.\s/) || trimmedLine.match(/^[ivx]+\.\s/) || trimmedLine.match(/^\d+\.\s/)) {
      formatted.push(
        <div key={`numbered-${index}`} className="pdf-numbered-item">
          {trimmedLine}
        </div>
      );
    }
    // Quoted or highlighted text (>)
    else if (trimmedLine.startsWith('>')) {
      const text = trimmedLine.replace(/^>\s*/, '');
      formatted.push(
        <blockquote key={`quote-${index}`} className="pdf-blockquote">
          {text}
        </blockquote>
      );
    }
    // Separator lines (---, ===)
    else if (trimmedLine.match(/^[-=]{3,}$/)) {
      formatted.push(
        <hr key={`separator-${index}`} className="pdf-separator" />
      );
    }
    // Warning/Note indicators
    else if (trimmedLine.match(/^⚠️|^💡|^ℹ️|^NOTE:|^WARNING:/i)) {
      formatted.push(
        <div key={`notice-${index}`} className="pdf-notice">
          {trimmedLine}
        </div>
      );
    }
    // Regular paragraph text
    else {
      formatted.push(
        <p key={`para-${index}`} className="pdf-paragraph">
          {trimmedLine}
        </p>
      );
    }
  });

  return formatted;
}

/**
 * Simple metadata extraction (backward compatible with previous version)
 * For more comprehensive metadata parsing, use parseMetadataHeader
 *
 * @param {string} content - The full document content
 * @returns {Object} Basic metadata fields
 */
export function parseDocumentMetadata(content) {
  const policyNumberMatch = content.match(/(?:Policy\s*(?:Number|#)?|Reference\s*Number)\s*:?\s*([A-Z0-9\-]+)/i);
  const titleMatch = content.match(/(?:Policy\s*Title)\s*:?\s*([^\n]+)/i);
  const effectiveDateMatch = content.match(/(?:Effective\s*Date|Date\s*Approved)\s*:?\s*([^\n]+)/i);
  const departmentMatch = content.match(/(?:Department|Applies\s*To|Document\s*Owner)\s*:?\s*([^\n]+)/i);

  return {
    policyNumber: policyNumberMatch ? policyNumberMatch[1].trim() : null,
    title: titleMatch ? titleMatch[1].trim() : null,
    policyTitle: titleMatch ? titleMatch[1].trim() : null, // Alias for compatibility
    effectiveDate: effectiveDateMatch ? effectiveDateMatch[1].trim() : null,
    department: departmentMatch ? departmentMatch[1].trim() : null,
  };
}
