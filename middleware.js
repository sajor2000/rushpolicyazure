import { NextResponse } from 'next/server';
import { RATE_LIMIT, CORS_CONFIG } from './app/constants';

/**
 * Next.js 14 Middleware for Rush Policy Assistant
 *
 * Implements:
 * 1. CORS headers for cross-origin requests (following Next.js official pattern)
 * 2. Rate limiting (IP-based, 20 requests/minute)
 *
 * Runs on all /api/* routes
 */

// In-memory rate limit tracking (use Redis in production for distributed systems)
const rateLimitMap = new Map();

/**
 * Get client IP from request headers
 * Supports various deployment environments (Vercel, Azure, etc.)
 */
function getClientIP(request) {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }

  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    request.ip ||
    'unknown'
  );
}

/**
 * Check if request exceeds rate limit
 * Uses sliding window algorithm with periodic cleanup
 */
function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;

  // Get or create request timestamps for this IP
  let timestamps = rateLimitMap.get(ip) || [];

  // Remove timestamps outside the current window
  timestamps = timestamps.filter(time => time > windowStart);

  // Check if limit exceeded
  if (timestamps.length >= RATE_LIMIT.MAX_REQUESTS) {
    return true;
  }

  // Add current timestamp
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  // Periodically cleanup old entries (1% chance per request)
  if (Math.random() < RATE_LIMIT.CLEANUP_PROBABILITY) {
    cleanupRateLimitMap(windowStart);
  }

  return false;
}

/**
 * Remove expired entries from rate limit map
 */
function cleanupRateLimitMap(windowStart) {
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const validTimestamps = timestamps.filter(time => time > windowStart);
    if (validTimestamps.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, validTimestamps);
    }
  }
}

export function middleware(request) {
  const origin = request.headers.get('origin') || '';

  // For development, allow localhost origins
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
  const allowOrigin = isDevelopment && isLocalhost;

  // Handle preflight (OPTIONS) requests for CORS
  if (request.method === 'OPTIONS') {
    const preflightHeaders = {
      'Access-Control-Allow-Methods': CORS_CONFIG.ALLOWED_METHODS,
      'Access-Control-Allow-Headers': CORS_CONFIG.ALLOWED_HEADERS,
      'Access-Control-Max-Age': CORS_CONFIG.MAX_AGE,
    };

    if (allowOrigin) {
      preflightHeaders['Access-Control-Allow-Origin'] = origin;
    }

    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // Rate limiting check
  const clientIP = getClientIP(request);
  if (isRateLimited(clientIP)) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a minute before trying again.',
        retryAfter: Math.ceil(RATE_LIMIT.WINDOW_MS / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(RATE_LIMIT.WINDOW_MS / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMIT.MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }

  // Create response and set CORS headers
  const response = NextResponse.next();

  if (allowOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', CORS_CONFIG.ALLOWED_METHODS);
  response.headers.set('Access-Control-Allow-Headers', CORS_CONFIG.ALLOWED_HEADERS);

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

// Apply middleware only to API routes
export const config = {
  matcher: '/api/:path*',
};
