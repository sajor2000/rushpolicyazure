import { NextResponse } from 'next/server';
import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';
import crypto from 'crypto';
import {
  AZURE_CONFIG,
  PERFORMANCE,
  ERROR_MESSAGES,
  AZURE_POLLING,
  RESPONSE_VALIDATION
} from '../../constants';

// Extracted utilities
import { checkRateLimit, cleanupRateLimits, escapePromptInjection } from './security';
import { withRetry, validateResponse, postProcessResponse, getClientIp } from './helpers';
import { generateSystemPrompt } from './systemPrompt';

// Initialize Azure AI Project client
const project = new AIProjectClient(
  process.env.AZURE_AI_ENDPOINT || AZURE_CONFIG.DEFAULT_ENDPOINT,
  new DefaultAzureCredential()
);

const AGENT_ID = process.env.AZURE_AI_AGENT_ID || AZURE_CONFIG.DEFAULT_AGENT_ID;

/**
 * STATELESS ARCHITECTURE FOR RAG ACCURACY
 *
 * NO thread storage - every request creates a fresh thread
 * This ensures:
 *   1. Zero conversation history between questions
 *   2. Fresh RAG database search for every query
 *   3. No hallucinations from previous context
 *   4. Maximum retrieval accuracy
 */

export async function POST(request) {
  const requestId = crypto.randomBytes(8).toString('hex');
  console.log(`[${requestId}] Azure AI Agent API Route called:`, new Date().toISOString());

  let conversationThread = null;

  try {
    const ip = getClientIp(request);

    if (!checkRateLimit(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP:`, ip);
      return NextResponse.json({
        error: 'Rate limit exceeded',
        hint: 'Please wait before trying again.'
      }, { status: 429 });
    }

    cleanupRateLimits();

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      console.warn(`[${requestId}] Invalid message type:`, typeof message);
      return NextResponse.json({
        error: ERROR_MESSAGES.MESSAGE_REQUIRED,
        hint: 'Message must be a non-empty string'
      }, { status: 400 });
    }

    // Sanitize control characters
    const sanitizedMessage = message
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .trim();

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

    console.log(`[${requestId}] Creating new conversation thread for fresh RAG search`);
    conversationThread = await withRetry(() =>
      project.agents.threads.create()
    );
    console.log(`[${requestId}] Fresh thread created:`, conversationThread.id);

    // Prompt injection defense
    const escapedMessage = escapePromptInjection(sanitizedMessage);

    // Create message in thread
    await withRetry(() =>
      project.agents.messages.create(
        conversationThread.id,
        "user",
        generateSystemPrompt(escapedMessage)
      )
    );

    // Create and poll run with timeout protection
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
        console.error(`[${requestId}] Agent response timeout after`, Date.now() - startTime, 'ms');
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

    // Retrieve messages
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

    // Find assistant's response
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

    // Response validation and processing
    if (assistantResponse.length > RESPONSE_VALIDATION.MAX_RESPONSE_SIZE) {
      console.warn(`[${requestId}] Response exceeds size limit:`, assistantResponse.length, 'bytes');
      return NextResponse.json({
        error: 'Policy document too large to display',
        hint: 'Please contact PolicyTech to request this document directly',
        size: assistantResponse.length
      }, { status: 413 });
    }

    console.log(`[${requestId}] Response length:`, assistantResponse.length, 'characters');

    let cleanResponse = typeof assistantResponse === 'string'
      ? assistantResponse
      : String(assistantResponse);

    // Post-processing: Clean formatting while preserving structure
    cleanResponse = postProcessResponse(cleanResponse);
    console.log(`[${requestId}] Response post-processed:`, cleanResponse.length, 'characters');

    // RAG accuracy monitoring
    const validation = validateResponse(cleanResponse, requestId);

    if (!validation.isValid) {
      validation.warnings.forEach(warning =>
        console.warn(`[${requestId}] ⚠️ RAG WARNING: ${warning}`)
      );
    }

    console.log(`[${requestId}] ✅ RAG VALIDATION: Found ${validation.citationCount} citations`);
    console.log(`[${requestId}] ✅ RAG VALIDATION: Fresh thread created for this request (ID: ${conversationThread.id})`);
    if (validation.hasAnswer && validation.hasDocument) {
      console.log(`[${requestId}] ✅ RAG VALIDATION: Response has correct two-part structure`);
    }

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

    // Sanitized error responses
    console.error(`[${requestId}] Full error:`, {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    });

    return NextResponse.json({
      error: 'An unexpected error occurred while processing your request',
      requestId: requestId,
      hint: 'Please try again or contact support if the issue persists'
    }, { status: 500 });

  } finally {
    // Thread cleanup
    if (conversationThread) {
      try {
        await project.agents.threads.delete(conversationThread.id);
        console.log(`[${requestId}] ✅ Thread cleaned up:`, conversationThread.id);
      } catch (cleanupError) {
        console.error(`[${requestId}] ⚠️ Failed to cleanup thread:`, cleanupError.message);
      }
    }
  }
}

// HTTP method validation - consolidated handler
const methodNotAllowed = () => NextResponse.json({
  error: 'Method not allowed',
  allowed: ['POST']
}, { status: 405 });

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const PATCH = methodNotAllowed;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'POST, OPTIONS'
    }
  });
}
