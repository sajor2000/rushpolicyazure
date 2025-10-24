import { NextResponse } from 'next/server';
import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';
import crypto from 'crypto';
import {
  AZURE_CONFIG,
  PERFORMANCE,
  ERROR_MESSAGES,
  SESSION_CONFIG,
  AZURE_POLLING,
  RATE_LIMIT,
  DEDUPLICATION,
  RESPONSE_VALIDATION
} from '../../constants';

// Extracted utilities
import {
  checkRateLimit,
  cleanupRateLimits,
  generateRequestHash,
  checkDuplicateRequest,
  cacheResponse,
  escapePromptInjection
} from './security';
import {
  withRetry,
  validateResponse,
  postProcessResponse,
  getClientIp
} from './helpers';
import { generateSystemPrompt } from './systemPrompt';

// Initialize Azure AI Project client
const project = new AIProjectClient(
  process.env.AZURE_AI_ENDPOINT || AZURE_CONFIG.DEFAULT_ENDPOINT,
  new DefaultAzureCredential()
);

const AGENT_ID = process.env.AZURE_AI_AGENT_ID || AZURE_CONFIG.DEFAULT_AGENT_ID;

// ═══════════════════════════════════════════════════════════════════════════════
// STATELESS ARCHITECTURE FOR RAG ACCURACY
// ═══════════════════════════════════════════════════════════════════════════════
// NO thread storage - every request creates a fresh thread
// This ensures:
//   1. Zero conversation history between questions
//   2. Fresh RAG database search for every query
//   3. No hallucinations from previous context
//   4. Maximum retrieval accuracy
// ═══════════════════════════════════════════════════════════════════════════════

// Security utilities, retry logic, and system prompt are now imported from:
// - ./security.js (rate limiting, deduplication, sanitization)
// - ./helpers.js (retry logic, response validation, IP extraction)
// - ./systemPrompt.js (AI agent system prompt generation)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN POST HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request) {
  const requestId = crypto.randomBytes(8).toString('hex');
  console.log(`[${requestId}] Azure AI Agent API Route called:`, new Date().toISOString());

  let conversationThread = null;

  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // SECURITY: CONTENT-TYPE VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`[${requestId}] Invalid Content-Type:`, contentType);
      return NextResponse.json({
        error: 'Invalid Content-Type',
        expected: 'application/json',
        received: contentType || 'none'
      }, { status: 415 }); // 415 Unsupported Media Type
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECURITY: RATE LIMITING
    // ═══════════════════════════════════════════════════════════════════════════
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    if (!checkRateLimit(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP:`, ip);
      return NextResponse.json({
        error: 'Rate limit exceeded',
        hint: `Maximum ${RATE_LIMIT.MAX_REQUESTS} requests per minute. Please wait before trying again.`
      }, { status: 429 });
    }

    cleanupRateLimits();

    // ═══════════════════════════════════════════════════════════════════════════
    // SECURITY: INPUT VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════
    const body = await request.json();
    const { message } = body;

    // Validate message exists and is correct type
    if (!message || typeof message !== 'string') {
      console.warn(`[${requestId}] Invalid message type:`, typeof message);
      return NextResponse.json({
        error: ERROR_MESSAGES.MESSAGE_REQUIRED,
        hint: 'Message must be a non-empty string'
      }, { status: 400 });
    }

    // Sanitize control characters first
    const sanitizedMessage = message
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .trim();

    // Check if message is empty after sanitization
    if (sanitizedMessage.length === 0) {
      console.warn(`[${requestId}] Empty message after sanitization`);
      return NextResponse.json({
        error: 'Message cannot be empty or whitespace only'
      }, { status: 400 });
    }

    // Enforce length limit
    if (sanitizedMessage.length > PERFORMANCE.MAX_MESSAGE_LENGTH) {
      console.warn(`[${requestId}] Message too long:`, sanitizedMessage.length, 'chars');
      return NextResponse.json({
        error: ERROR_MESSAGES.MESSAGE_TOO_LONG(PERFORMANCE.MAX_MESSAGE_LENGTH),
        actualLength: sanitizedMessage.length
      }, { status: 400 });
    }

    console.log(`[${requestId}] Message validated:`, sanitizedMessage.length, 'characters');

    // ═══════════════════════════════════════════════════════════════════════════
    // SECURITY: REQUEST DEDUPLICATION
    // ═══════════════════════════════════════════════════════════════════════════
    const messageHash = generateRequestHash(sanitizedMessage);
    const cachedResponse = checkDuplicateRequest(messageHash);

    if (cachedResponse) {
      console.log(`[${requestId}] ⚡ Returning cached response (duplicate request)`);
      return NextResponse.json({
        response: cachedResponse,
        cached: true
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CRITICAL FOR RAG ACCURACY: Create fresh thread
    // ═══════════════════════════════════════════════════════════════════════════
    // Always create a fresh thread for each question to ensure:
    // 1. Hallucinations from previous responses don't occur
    // 2. Incorrect answers from conversation bleed-over are prevented
    // 3. Fresh RAG database search is triggered
    // 4. Maximum retrieval accuracy is maintained
    //
    // DO NOT store threads - we want ZERO conversation history

    console.log(`[${requestId}] Creating new conversation thread for fresh RAG search (stateless mode)`);
    conversationThread = await withRetry(() =>
      project.agents.threads.create()
    );
    console.log(`[${requestId}] Fresh thread created:`, conversationThread.id);

    // ═══════════════════════════════════════════════════════════════════════════
    // SECURITY: PROMPT INJECTION DEFENSE
    // ═══════════════════════════════════════════════════════════════════════════
    const escapedMessage = escapePromptInjection(sanitizedMessage);

    // Create message in the thread with system prompt
    await withRetry(() =>
      project.agents.messages.create(
        conversationThread.id,
        "user",
        generateSystemPrompt(escapedMessage)
      )
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATE AND POLL RUN WITH TIMEOUT PROTECTION
    // ═══════════════════════════════════════════════════════════════════════════
    let run = await withRetry(() =>
      project.agents.runs.create(conversationThread.id, AGENT_ID)
    );

    const { MAX_POLL_TIME_MS, POLL_INTERVAL_MS } = AZURE_POLLING;
    const startTime = Date.now();
    const MAX_POLL_ATTEMPTS = MAX_POLL_TIME_MS / POLL_INTERVAL_MS;
    let pollAttempts = 0;

    while (run.status === "queued" || run.status === "in_progress") {
      // Check for timeout
      if (Date.now() - startTime > MAX_POLL_TIME_MS || pollAttempts >= MAX_POLL_ATTEMPTS) {
        console.error(`[${requestId}] ⚠️ Agent response timeout after`, Date.now() - startTime, 'ms');
        return NextResponse.json({
          error: ERROR_MESSAGES.TIMEOUT,
          details: `Agent did not respond within ${MAX_POLL_TIME_MS/1000} seconds`,
          hint: 'Try simplifying your question or retry later'
        }, { status: 504 });
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

      try {
        run = await project.agents.runs.get(conversationThread.id, run.id);
        pollAttempts++;
      } catch (pollError) {
        console.error(`[${requestId}] Polling error:`, pollError.message);
        // Retry once, then fail
        if (pollAttempts > 2) {
          return NextResponse.json({
            error: 'Failed to check agent status',
            hint: 'Please try again'
          }, { status: 500 });
        }
      }
    }

    console.log(`[${requestId}] Run status:`, run.status);

    // Validate terminal status
    if (!['completed', 'failed', 'cancelled', 'expired'].includes(run.status)) {
      console.error(`[${requestId}] Unexpected run status:`, run.status);
      return NextResponse.json({
        error: 'Agent run in unexpected state',
        status: run.status,
        hint: 'Please try again'
      }, { status: 500 });
    }

    if (run.status === "failed") {
      console.error(`[${requestId}] Run failed:`, run.lastError);
      return NextResponse.json({
        error: 'Agent run failed',
        hint: 'The AI agent encountered an error. Please try again.'
      }, { status: 500 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RETRIEVE MESSAGES WITH ERROR HANDLING
    // ═══════════════════════════════════════════════════════════════════════════
    let messages;
    try {
      messages = await project.agents.messages.list(conversationThread.id, { order: "asc" });
    } catch (messageError) {
      console.error(`[${requestId}] Failed to retrieve messages:`, messageError);
      return NextResponse.json({
        error: 'Failed to retrieve agent response',
        hint: 'The agent may have processed your request but the response could not be retrieved'
      }, { status: 500 });
    }

    if (!messages) {
      console.error(`[${requestId}] Messages list returned null/undefined`);
      return NextResponse.json({
        error: ERROR_MESSAGES.NO_RESPONSE_AGENT
      }, { status: 500 });
    }

    // Find the assistant's response
    let assistantResponse = null;
    for await (const m of messages) {
      if (m.role === 'assistant') {
        const content = m.content.find((c) => c.type === "text" && "text" in c);
        if (content) {
          assistantResponse = content.text.value;
          break;
        }
      }
    }

    if (!assistantResponse) {
      console.error(`[${requestId}] No assistant response found`);
      return NextResponse.json({ error: ERROR_MESSAGES.NO_RESPONSE_AGENT }, { status: 500 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RESPONSE VALIDATION AND PROCESSING
    // ═══════════════════════════════════════════════════════════════════════════

    // Check response size
    if (assistantResponse.length > RESPONSE_VALIDATION.MAX_RESPONSE_SIZE) {
      console.warn(`[${requestId}] ⚠️ Response exceeds size limit:`, assistantResponse.length, 'bytes');
      return NextResponse.json({
        error: 'Policy document too large to display',
        hint: 'Please contact PolicyTech to request this document directly',
        size: assistantResponse.length
      }, { status: 413 }); // 413 Payload Too Large
    }

    console.log(`[${requestId}] Response length:`, assistantResponse.length, 'characters');

    // Ensure the response is a valid string
    let cleanResponse = typeof assistantResponse === 'string'
      ? assistantResponse
      : String(assistantResponse);

    // ═══════════════════════════════════════════════════════════════════════════
    // POST-PROCESSING: Clean formatting while preserving structure
    // ═══════════════════════════════════════════════════════════════════════════

    // Step 1: Extract all citation marks before removing them
    const citations = [];
    const citationRegex = /【([^】]{1,200})】/g; // Limit capture group to prevent ReDoS
    let match;
    let iterationCount = 0;
    const MAX_ITERATIONS = 1000;

    while ((match = citationRegex.exec(cleanResponse)) !== null) {
      if (++iterationCount > MAX_ITERATIONS) {
        console.warn(`[${requestId}] ⚠️ Citation extraction exceeded max iterations`);
        break;
      }
      citations.push(match[1].substring(0, 200));
    }

    // Step 2: Clean formatting ONLY (keep PART 1 and PART 2 structure)
    cleanResponse = cleanResponse
      // Remove citation marks from body (will add at bottom)
      .replace(/【[^】]+】/g, '')
      // Remove ** markdown bold markers
      .replace(/\*\*/g, '')
      // Clean up excessive whitespace
      .replace(/\n{3,}/g, '\n\n')                  // Reduce triple+ newlines to double
      .replace(/^\s+$\n/gm, '')                     // Remove whitespace-only lines
      .replace(/\s+$/gm, '')                        // Remove trailing whitespace from each line
      .trim();                                      // Remove leading/trailing whitespace

    // Step 3: Add citations at the bottom if any were found
    if (citations.length > 0) {
      const uniqueCitations = [...new Set(citations)]; // Remove duplicates
      cleanResponse += '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      cleanResponse += 'SOURCE CITATIONS\n';
      cleanResponse += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      uniqueCitations.forEach((citation, index) => {
        cleanResponse += `[${index + 1}] ${citation}\n`;
      });
    }

    console.log(`[${requestId}] Cleaned response length:`, cleanResponse.length, 'characters');
    console.log(`[${requestId}] Citations extracted:`, citations.length);

    // ═══════════════════════════════════════════════════════════════════════════
    // RAG ACCURACY MONITORING
    // ═══════════════════════════════════════════════════════════════════════════
    // Validate response quality to detect potential hallucinations

    // 1. Citation count validation
    if (citations.length === 0) {
      console.warn(`[${requestId}] ⚠️ RAG WARNING: No citations found in response - possible hallucination or general response`);
    } else {
      console.log(`[${requestId}] ✅ RAG VALIDATION: Found`, citations.length, 'citations');
    }

    // 2. Fresh thread confirmation
    console.log(`[${requestId}] ✅ RAG VALIDATION: Fresh thread created for this request (ID:`, conversationThread.id, ')');

    // 3. Response structure validation
    const hasPart1 = cleanResponse.includes('SYNTHESIZED ANSWER') || cleanResponse.includes('ANSWER:');
    const hasPart2 = cleanResponse.includes('FULL_POLICY_DOCUMENT') || cleanResponse.includes('RUSH UNIVERSITY SYSTEM FOR HEALTH');

    if (!hasPart1 || !hasPart2) {
      console.warn(`[${requestId}] ⚠️ RAG WARNING: Response missing expected structure (Part 1:`, hasPart1, ', Part 2:', hasPart2, ')');
    } else {
      console.log(`[${requestId}] ✅ RAG VALIDATION: Response has correct two-part structure`);
    }

    // 4. Suspicious phrase detection (common hallucination indicators)
    const suspiciousPhrases = [
      'based on my knowledge',
      'i believe',
      'in my experience',
      'generally speaking',
      'typically',
      'usually'
    ];

    const lowerResponse = cleanResponse.toLowerCase();
    const foundSuspicious = suspiciousPhrases.filter(phrase => lowerResponse.includes(phrase));

    if (foundSuspicious.length > 0) {
      console.warn(`[${requestId}] ⚠️ RAG WARNING: Response contains suspicious phrases:`, foundSuspicious);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CACHE RESPONSE FOR DEDUPLICATION
    // ═══════════════════════════════════════════════════════════════════════════
    cacheResponse(messageHash, cleanResponse);

    // Return response (stateless - no session cookies needed)
    return NextResponse.json({ response: cleanResponse });

  } catch (error) {
    console.error(`[${requestId}] Azure AI Agent API Error:`, error);

    // Check for specific Azure connection errors
    if (error.message && error.message.includes('ENOTFOUND')) {
      return NextResponse.json({
        error: ERROR_MESSAGES.AZURE_CONNECTION_FAILED,
        hint: 'Azure firewall may be blocking requests'
      }, { status: 500 });
    }

    if (error.status === 401) {
      return NextResponse.json({
        error: ERROR_MESSAGES.AUTH_FAILED,
        hint: 'Check your Azure credentials and endpoint configuration'
      }, { status: 500 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECURITY: SANITIZED ERROR RESPONSES
    // ═══════════════════════════════════════════════════════════════════════════
    // Log full error server-side, return sanitized error to client
    console.error(`[${requestId}] Full error:`, {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    });

    return NextResponse.json({
      error: 'An unexpected error occurred while processing your request',
      requestId: requestId, // For support tracking
      hint: 'Please try again or contact support if the issue persists'
    }, { status: 500 });

  } finally {
    // ═══════════════════════════════════════════════════════════════════════════
    // CRITICAL FIX: THREAD CLEANUP
    // ═══════════════════════════════════════════════════════════════════════════
    // Always clean up thread even if request fails
    if (conversationThread) {
      try {
        await project.agents.threads.delete(conversationThread.id);
        console.log(`[${requestId}] ✅ Thread cleaned up:`, conversationThread.id);
      } catch (cleanupError) {
        console.error(`[${requestId}] ⚠️ Failed to cleanup thread:`, cleanupError.message);
        // Don't throw - cleanup failure shouldn't affect response
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HTTP METHOD VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed',
    allowed: ['POST']
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    error: 'Method not allowed',
    allowed: ['POST']
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    error: 'Method not allowed',
    allowed: ['POST']
  }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({
    error: 'Method not allowed',
    allowed: ['POST']
  }, { status: 405 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'POST, OPTIONS'
    }
  });
}
