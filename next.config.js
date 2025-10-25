
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // CORS and Security headers
  async headers() {
    // Content Security Policy
    // Note: Development needs 'unsafe-inline' and 'unsafe-eval' for Next.js HMR and React
    // Production should use nonces or hashes for better security
    const isDev = process.env.NODE_ENV !== 'production';

    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : ""} https://fonts.googleapis.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com data:;
      img-src 'self' data: blob: https://fonts.googleapis.com https://fonts.gstatic.com;
      connect-src 'self' ${isDev ? "http://localhost:* ws://localhost:* ws://127.0.0.1:*" : ""} https://*.azure.com https://*.microsoft.com https://*.services.ai.azure.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      ${isDev ? "" : "upgrade-insecure-requests;"}
    `.replace(/\s{2,}/g, ' ').trim();

    // Get production domain for CORS - fail safely by restricting access
    const productionOrigin = process.env.ALLOWED_ORIGIN || 'https://rushpolicychat.replit.app';

    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          }
        ],
      },
      {
        // Apply CORS headers to API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? productionOrigin
              : '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400' // 24 hours
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig
