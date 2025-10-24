/**
 * Azure AI Agent Helper Utilities
 *
 * Provides retry logic, response validation, and other helper functions
 * for Azure AI Agent operations.
 */

import { AZURE_POLLING, RESPONSE_VALIDATION } from '../../constants';

// ═══════════════════════════════════════════════════════════════════════════════
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Retry an async operation with exponential backoff
 * Only retries on network errors, not auth failures
 *
 * @param {Function} operation - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts (default: from config)
 * @returns {Promise<any>} Result of successful operation
 * @throws {Error} Last error if all retries exhausted
 */
export async function withRetry(operation, maxRetries = AZURE_POLLING.MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Only retry on network errors, not auth failures
      if (attempt === maxRetries || error.status === 401 || error.status === 403) {
        throw error;
      }
      const delayMs = 1000 * Math.pow(AZURE_POLLING.BACKOFF_MULTIPLIER, attempt - 1);
      console.warn(`Retry ${attempt}/${maxRetries} after error:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate Azure AI Agent response for quality and safety
 * Checks for citations, proper structure, and suspicious hallucination phrases
 *
 * @param {string} response - AI response text to validate
 * @param {string} requestId - Request ID for logging
 * @returns {Object} Validation result with warnings
 */
export function validateResponse(response, requestId) {
  const warnings = [];

  // Check response size
  if (response.length > RESPONSE_VALIDATION.MAX_RESPONSE_SIZE) {
    warnings.push('Response exceeds maximum size');
    console.warn(`[${requestId}] ⚠️ RAG WARNING: Response too large (${response.length} chars)`);
  }

  // Check for citation marks 【source†file.pdf】
  const citationCount = (response.match(/【[^】]+】/g) || []).length;
  if (citationCount === 0) {
    warnings.push('No citations found - possible hallucination');
    console.warn(`[${requestId}] ⚠️ RAG WARNING: No citations found in response - possible hallucination`);
  } else {
    console.log(`[${requestId}] ✅ RAG VALIDATION: Found ${citationCount} citations`);
  }

  // Check for two-part structure (ANSWER: and FULL_POLICY_DOCUMENT:)
  const hasAnswer = response.includes('ANSWER:');
  const hasDocument = response.includes('FULL_POLICY_DOCUMENT:');

  if (RESPONSE_VALIDATION.REQUIRE_TWO_PART_STRUCTURE) {
    if (!hasAnswer || !hasDocument) {
      warnings.push('Missing two-part structure (ANSWER + FULL_POLICY_DOCUMENT)');
      console.warn(`[${requestId}] ⚠️ RAG WARNING: Response missing proper structure (hasAnswer: ${hasAnswer}, hasDocument: ${hasDocument})`);
    } else {
      console.log(`[${requestId}] ✅ RAG VALIDATION: Response has correct two-part structure`);
    }
  }

  // Check for suspicious hallucination phrases
  const suspiciousPhrases = [
    'based on my knowledge',
    'i believe',
    'typically',
    'usually',
    'generally speaking',
    'in my experience'
  ];

  const foundSuspicious = suspiciousPhrases.filter(phrase =>
    response.toLowerCase().includes(phrase)
  );

  if (foundSuspicious.length > 0) {
    warnings.push(`Contains suspicious phrases: ${foundSuspicious.join(', ')}`);
    console.warn(`[${requestId}] ⚠️ RAG WARNING: Response contains suspicious phrases:`, foundSuspicious);
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    citationCount,
    hasAnswer,
    hasDocument
  };
}

/**
 * Post-process Azure AI response to clean up formatting
 * Removes citation marks from body and relocates to footer
 *
 * @param {string} response - Raw AI response
 * @returns {string} Cleaned response
 */
export function postProcessResponse(response) {
  // Extract citation marks 【source†file.pdf】 from body
  const citations = [];
  let cleaned = response.replace(/【([^】]+)】/g, (match, citation) => {
    if (!citations.includes(citation)) {
      citations.push(citation);
    }
    return ''; // Remove from body
  });

  // Remove ** markdown formatting (use italic only)
  cleaned = cleaned.replace(/\*\*/g, '');

  // Clean excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Add citations footer if any were found
  if (citations.length > 0) {
    cleaned += '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    cleaned += 'SOURCE CITATIONS\n';
    cleaned += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    citations.forEach((citation, index) => {
      cleaned += `[${index + 1}] ${citation}\n`;
    });
  }

  return cleaned;
}

/**
 * Get client IP address from request headers
 * Handles various proxy headers (X-Forwarded-For, X-Real-IP, etc.)
 *
 * @param {Request} request - Next.js request object
 * @returns {string} Client IP address or 'unknown'
 */
export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-client-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    request.ip ||
    'unknown'
  );
}
