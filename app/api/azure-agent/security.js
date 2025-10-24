/**
 * Security Utilities for Azure AI Agent
 *
 * Provides rate limiting, request deduplication, and input sanitization
 * to protect the API from abuse and ensure safe operation.
 */

import crypto from 'crypto';
import { RATE_LIMIT, DEDUPLICATION } from '../../constants';

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST DEDUPLICATION
// ═══════════════════════════════════════════════════════════════════════════════
const recentRequests = new Map(); // hash -> { timestamp, response }

/**
 * Generate hash for request deduplication
 * @param {string} message - User message to hash
 * @returns {string} SHA-256 hash of normalized message
 */
export function generateRequestHash(message) {
  return crypto.createHash('sha256')
    .update(message.trim().toLowerCase())
    .digest('hex');
}

/**
 * Check if request is duplicate and return cached response if exists
 * @param {string} hash - Request hash
 * @returns {string|null} Cached response or null if not duplicate
 */
export function checkDuplicateRequest(hash) {
  const existing = recentRequests.get(hash);
  if (existing && Date.now() - existing.timestamp < DEDUPLICATION.WINDOW_MS) {
    return existing.response;
  }
  return null;
}

/**
 * Cache response for request deduplication
 * @param {string} hash - Request hash
 * @param {string} response - Response to cache
 */
export function cacheResponse(hash, response) {
  recentRequests.set(hash, {
    timestamp: Date.now(),
    response
  });

  // Cleanup if cache gets too large
  if (recentRequests.size > DEDUPLICATION.CLEANUP_THRESHOLD) {
    const cutoff = Date.now() - DEDUPLICATION.WINDOW_MS;
    for (const [h, data] of recentRequests.entries()) {
      if (data.timestamp < cutoff) {
        recentRequests.delete(h);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════════

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
