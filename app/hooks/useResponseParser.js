import { useCallback } from 'react';
import { parseResponse as parseResponseUtil } from '../utils/policyParser';

/**
 * Custom hook for parsing AI agent responses
 *
 * Extracts structured data from the two-part response format:
 * - PART 1: SYNTHESIZED_ANSWER
 * - PART 2: FULL_POLICY_DOCUMENT
 *
 * Wraps the utility function in useCallback for React optimization
 *
 * @returns {Object} Parser functions
 */
export function useResponseParser() {
  /**
   * Parse AI response into answer, document, and metadata
   * Memoized with useCallback for performance
   */
  const parseResponse = useCallback((content) => {
    return parseResponseUtil(content);
  }, []);

  return { parseResponse };
}
