/**
 * Security Utilities for Azure AI Agent
 *
 * Provides rate limiting and input sanitization to protect the API
 * from abuse and ensure safe operation.
 */

import { RATE_LIMIT } from '../../constants';

// Rate limiting storage
const requestCounts = new Map(); // IP -> { count, resetTime }

/**
 * Check if IP address has exceeded rate limit
 * @param {string} ip - Client IP address
 * @returns {boolean} True if request is allowed, false if rate limited
 */
export function checkRateLimit(ip) {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT.WINDOW_MS
    });
    return true;
  }

  if (record.count >= RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Cleanup old rate limit entries periodically
 * Called with low probability on each request to avoid memory leaks
 */
export function cleanupRateLimits() {
  if (Math.random() < RATE_LIMIT.CLEANUP_PROBABILITY) {
    const now = Date.now();
    for (const [ip, data] of requestCounts.entries()) {
      if (now > data.resetTime) {
        requestCounts.delete(ip);
      }
    }
  }
}

/**
 * Escape prompt injection attempts in user input
 * Sanitizes template literal characters, quotes, and newlines
 *
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input safe from prompt injection
 */
export function escapePromptInjection(input) {
  return input
    .replace(/[`${}]/g, '\\$&')      // Escape template literal chars
    .replace(/"/g, '\\"')            // Escape quotes
    .replace(/\n/g, ' ')             // Remove newlines (prevent multi-line injection)
    .trim();
}
