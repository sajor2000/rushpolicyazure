/**
 * Centralized Constants for Rush Policy Assistant
 * 
 * This file contains all configuration values, API endpoints, limits,
 * and messages used throughout the application for easier maintenance
 * and optimization tuning.
 */

// API Endpoints
export const API_ENDPOINTS = {
  AZURE_AGENT: '/api/azure-agent',
  HEALTH: '/api/health'
};

// Performance and Safety Limits
export const PERFORMANCE = {
  MAX_MESSAGE_LENGTH: 2000,          // Maximum characters in user message
  MAX_METADATA_LINES: 50,            // Safety limit for metadata parsing
  TOAST_DURATION: 3000,              // Toast notification duration (ms)
  SCROLL_THRESHOLD: 100,             // Pixels from bottom to trigger auto-scroll
  CHARACTER_WARNING_THRESHOLD: 1800  // Show warning when approaching limit
};

// Error Messages
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'I apologize, but I\'m having trouble connecting to the PolicyTech database. Please try again or contact IT support if the issue persists.',
  MESSAGE_TOO_LONG: (max) => `Message too long. Maximum ${max} characters allowed.`,
  MESSAGE_REQUIRED: 'Message is required',
  INVALID_RESPONSE: 'Invalid response from server. The policy data may contain formatting issues.',
  NO_RESPONSE_AGENT: 'No response from agent',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  COPY_FAILED: 'Failed to copy',
  AZURE_CONNECTION_FAILED: 'Azure connection failed',
  AZURE_FIREWALL: 'Cannot reach Azure AI endpoint. This might be due to network restrictions.',
  AUTH_FAILED: 'Authentication failed',
  AGENT_RUN_FAILED: 'Agent run failed',
  TIMEOUT: 'The agent took too long to respond. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  COPIED: 'Copied to clipboard!',
  RESPONSE_RECEIVED: 'Response received!',
  CONVERSATION_CLEARED: 'Conversation cleared'
};

// Azure AI Configuration
export const AZURE_CONFIG = {
  DEFAULT_ENDPOINT: 'https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project',
  DEFAULT_AGENT_ID: 'asst_301EhwakRXWsOCgGQt276WiU',
  API_VERSION: '2024-05-01-preview'
};

// Rate Limiting Configuration
export const RATE_LIMIT = {
  WINDOW_MS: 60000,      // 1 minute window
  MAX_REQUESTS: 20,      // Max requests per window
  CLEANUP_PROBABILITY: 0.01  // 1% chance to cleanup old entries
};

// CORS Configuration
export const CORS_CONFIG = {
  ALLOWED_METHODS: 'GET, POST, OPTIONS',
  ALLOWED_HEADERS: 'Content-Type, Authorization',
  MAX_AGE: '86400'  // 24 hours
};

// Azure Polling Configuration
export const AZURE_POLLING = {
  MAX_POLL_TIME_MS: 120000,     // 2 minutes
  POLL_INTERVAL_MS: 1000,       // 1 second
  MAX_RETRIES: 3,               // Maximum retry attempts for transient failures
  BACKOFF_MULTIPLIER: 1.5       // Exponential backoff multiplier
};

// Request Deduplication Configuration
export const DEDUPLICATION = {
  WINDOW_MS: 5000,              // 5 second window for duplicate detection
  MAX_CACHE_SIZE: 100,          // Maximum cached request hashes
  CLEANUP_THRESHOLD: 150        // Trigger cleanup at this size
};

// Response Validation Configuration
export const RESPONSE_VALIDATION = {
  MAX_RESPONSE_SIZE: 500000,    // 500KB maximum response size
  MIN_CITATIONS: 0,             // Minimum citations (0 allows fallback messages)
  REQUIRE_TWO_PART_STRUCTURE: true
};
