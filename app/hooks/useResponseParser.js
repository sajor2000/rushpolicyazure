import { useCallback } from 'react';

/**
 * Custom hook for parsing AI agent responses
 *
 * Extracts structured data from the two-part response format:
 * - PART 1: SYNTHESIZED_ANSWER
 * - PART 2: FULL_POLICY_DOCUMENT
 *
 * @returns {Object} Parser functions
 */
export function useResponseParser() {
  /**
   * Parse AI response into answer, document, and metadata
   * @param {string} content - Raw response content
   * @returns {Object} Parsed response with answer, fullDocument, and metadata
   */
  const parseResponse = useCallback((content) => {
    let answer = '';
    let fullDocument = '';

    // Extract answer section (PART 1)
    const answerMatch = content.match(/ANSWER:\s*([\s\S]*?)(?=━+\s*PART 2|FULL_POLICY_DOCUMENT:|$)/i);

    // Extract document section (PART 2) with fallback patterns
    const documentMatch =
      content.match(/FULL_POLICY_DOCUMENT:\s*([\s\S]*?)(?=━+\s*SOURCE CITATIONS|$)/i) ||
      content.match(/(?:PART 2.*?\n+)?(RUSH UNIVERSITY SYSTEM FOR HEALTH[\s\S]*?)(?=━+\s*SOURCE CITATIONS|$)/i);

    if (answerMatch?.[1]) {
      answer = answerMatch[1]
        .replace(/━+/g, '')
        .replace(/PART \d+ - .*?\n/gi, '')
        .trim();
    }

    if (documentMatch?.[1]) {
      fullDocument = documentMatch[1].trim();
    } else if (!answer) {
      // Fallback: use entire content as document only if no answer found
      fullDocument = content;
    }

    // Extract metadata from document
    const metadata = extractMetadata(fullDocument);

    return {
      answer,
      fullDocument,
      content,
      metadata
    };
  }, []);

  /**
   * Extract key metadata fields from policy document
   * @param {string} document - Full policy document text
   * @returns {Object} Extracted metadata
   */
  const extractMetadata = (document) => {
    return {
      policyNumber: document.match(/(?:Policy\s*(?:Number|#)?|Reference\s*Number)\s*:?\s*([A-Z0-9\-]+)/i)?.[1]?.trim() || null,
      policyTitle: document.match(/(?:Policy\s*Title)\s*:?\s*([^\n]+)/i)?.[1]?.trim() || null,
      effectiveDate: document.match(/(?:Effective\s*Date|Date\s*Approved)\s*:?\s*([^\n]+)/i)?.[1]?.trim() || null,
      department: document.match(/(?:Department|Applies\s*To|Document\s*Owner)\s*:?\s*([^\n]+)/i)?.[1]?.trim() || null,
    };
  };

  return { parseResponse };
}
