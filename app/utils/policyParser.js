/**
 * Policy Response Parser Utility
 *
 * Extracts structured data from Azure AI Agent responses
 * Handles the two-part format: ANSWER + FULL_POLICY_DOCUMENT
 */

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

  // Extract key metadata from the full document section
  const policyNumberMatch = fullDocument.match(/(?:Policy\s*(?:Number|#)?|Reference\s*Number)\s*:?\s*([A-Z0-9\-]+)/i);
  const titleMatch = fullDocument.match(/(?:Policy\s*Title)\s*:?\s*([^\n]+)/i);
  const effectiveDateMatch = fullDocument.match(/(?:Effective\s*Date|Date\s*Approved)\s*:?\s*([^\n]+)/i);
  const departmentMatch = fullDocument.match(/(?:Department|Applies\s*To|Document\s*Owner)\s*:?\s*([^\n]+)/i);

  return {
    answer: answer,
    fullDocument: fullDocument,
    content: content, // Keep full content for backward compatibility
    metadata: {
      policyNumber: policyNumberMatch ? policyNumberMatch[1].trim() : null,
      policyTitle: titleMatch ? titleMatch[1].trim() : null,
      effectiveDate: effectiveDateMatch ? effectiveDateMatch[1].trim() : null,
      department: departmentMatch ? departmentMatch[1].trim() : null,
    }
  };
}
