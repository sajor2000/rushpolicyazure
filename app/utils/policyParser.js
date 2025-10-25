/**
 * Policy Response Parser Utility
 *
 * Extracts structured data from Azure AI Agent responses
 * Handles the two-part format: ANSWER + FULL_POLICY_DOCUMENT
 */

import { parseDocumentMetadata } from './documentFormatter';

/**
 * Parse AI response into answer and document sections with metadata
 * @param {string} content - Full response content from Azure AI Agent
 * @returns {Object} Parsed response with answer, fullDocument, and metadata
 */
export function parseResponse(content) {
  // Split content into answer and full document sections
  let answer = '';
  let fullDocument = '';

  // Look for the ANSWER: and FULL_POLICY_DOCUMENT: markers
  // Stop answer extraction at PART 2 separator or FULL_POLICY_DOCUMENT marker
  const answerMatch = content.match(/ANSWER:\s*([\s\S]*?)(?=━+\s*PART 2|FULL_POLICY_DOCUMENT:|$)/i);

  // Try multiple patterns to extract the full document:
  // 1. Look for FULL_POLICY_DOCUMENT: marker
  // 2. Look for RUSH UNIVERSITY SYSTEM FOR HEALTH header (fallback)
  const documentMatch = content.match(/FULL_POLICY_DOCUMENT:\s*([\s\S]*?)(?=━+\s*SOURCE CITATIONS|$)/i) ||
                       content.match(/(?:PART 2.*?\n+)?(RUSH UNIVERSITY SYSTEM FOR HEALTH[\s\S]*?)(?=━+\s*SOURCE CITATIONS|$)/i);

  if (answerMatch && answerMatch[1]) {
    // Clean up the answer (remove separator lines and extra whitespace)
    answer = answerMatch[1]
      .replace(/━+/g, '') // Remove separator lines
      .replace(/PART \d+ - .*?\n/gi, '') // Remove PART headers
      .trim();
  }

  if (documentMatch && documentMatch[1]) {
    fullDocument = documentMatch[1].trim();
  } else {
    // Only use fallback if we have BOTH no answer and no document match
    // This prevents mixing both parts together
    if (!answer) {
      fullDocument = content;
    }
  }

  // Extract key metadata from the full document section using shared utility
  const metadata = parseDocumentMetadata(fullDocument);

  return {
    answer: answer,
    fullDocument: fullDocument,
    content: content, // Keep full content for backward compatibility
    metadata: {
      policyNumber: metadata.policyNumber,
      policyTitle: metadata.policyTitle,
      effectiveDate: metadata.effectiveDate,
      department: metadata.department,
    }
  };
}
