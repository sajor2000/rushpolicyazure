/**
 * Cache Manager Utility
 *
 * Provides client-side caching functionality for policy queries
 * Uses simple hash-based keys and 5-minute TTL for safety
 */

/**
 * Generate cache key from user message
 * Normalizes message for consistent caching
 *
 * @param {string} message - User's query message
 * @returns {string} Cache key
 */
export function generateCacheKey(message) {
  if (!message || typeof message !== 'string') {
    return null;
  }

  // Normalize message: lowercase, trim, remove extra whitespace
  const normalized = message
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, ''); // Remove punctuation for better matching

  // Generate simple hash (FNV-1a algorithm)
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return `policy_query_${(hash >>> 0).toString(36)}`;
}

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  // 5 minutes TTL for safety (policies may update)
  TTL: 5 * 60 * 1000,

  // SWR dedupe interval (prevent duplicate requests within 2 seconds)
  DEDUPE_INTERVAL: 2000,

  // Revalidate on focus (check for updates when user returns to tab)
  REVALIDATE_ON_FOCUS: true,

  // Revalidate on reconnect (check for updates when connection restored)
  REVALIDATE_ON_RECONNECT: true,
};

/**
 * Check if a cached response is still valid
 *
 * @param {Object} cachedData - Cached response object
 * @param {number} cachedData.timestamp - When the data was cached
 * @returns {boolean} True if cache is still valid
 */
export function isCacheValid(cachedData) {
  if (!cachedData || !cachedData.timestamp) {
    return false;
  }

  const now = Date.now();
  const age = now - cachedData.timestamp;

  return age < CACHE_CONFIG.TTL;
}

/**
 * Format response data for caching
 *
 * @param {Object} response - API response
 * @returns {Object} Cached data object
 */
export function createCacheEntry(response) {
  return {
    response,
    timestamp: Date.now(),
    version: '1.0', // Cache version for future migrations
  };
}

/**
 * SWR fetcher function for policy queries (non-streaming)
 * Used with useSWR hook for automatic caching
 *
 * @param {string} url - API endpoint URL
 * @param {Object} body - Request body
 * @returns {Promise<Object>} Response data
 */
export async function policyFetcher(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.info = await response.json();
    error.status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * Common policy queries that benefit most from caching
 * These are frequently asked questions across the organization
 */
export const COMMON_QUERIES = [
  'What are our HIPAA privacy requirements?',
  'Show me the infection control policy',
  'Can I work remotely?',
  'How does PTO accrual work?',
  'What is our code of conduct?',
  'Patient safety protocols',
  'Emergency procedures',
  'Dress code policy',
];

/**
 * Pre-warm cache with common queries (optional optimization)
 * Can be called on app initialization or during idle time
 *
 * @param {Function} fetcher - Function to fetch data
 * @returns {Promise<void>}
 */
export async function prewarmCache(fetcher) {
  const cachePromises = COMMON_QUERIES.map(async (query) => {
    try {
      await fetcher('/api/azure-agent', { message: query });
    } catch (error) {
      // Silently fail - prewarm is optional optimization
      console.warn(`Failed to prewarm cache for: ${query}`);
    }
  });

  await Promise.allSettled(cachePromises);
}

/**
 * Clear all cached policy data
 * Useful when user explicitly requests refresh
 */
export function clearPolicyCache() {
  // This would work with SWR's mutate function
  // Implementation depends on how SWR is used in the app
  if (typeof window !== 'undefined' && window.localStorage) {
    const keys = Object.keys(window.localStorage);
    keys.forEach(key => {
      if (key.startsWith('policy_query_') || key.startsWith('swr-')) {
        window.localStorage.removeItem(key);
      }
    });
  }
}
