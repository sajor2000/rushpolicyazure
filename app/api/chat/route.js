import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

// Only initialize OpenAI client if credentials are available
let client = null;
let ASSISTANT_ID = null;

if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
  client = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT, 
    apiVersion: "2024-05-01-preview"
  });
  ASSISTANT_ID = process.env.ASSISTANT_ID;
}

// Session-based thread storage with LRU cache (prevents memory leaks and cross-user contamination)
const conversationThreads = new Map();
const MAX_THREADS = 1000;

// Helper function to clean up old threads (LRU eviction)
function cleanupOldThreads() {
  if (conversationThreads.size > MAX_THREADS) {
    const firstKey = conversationThreads.keys().next().value;
    conversationThreads.delete(firstKey);
    console.log(`Evicted old thread: ${firstKey}`);
  }
}

export async function POST(request) {
  console.log('API Route called:', new Date().toISOString());

  // Check if OpenAI client is available
  if (!client || !ASSISTANT_ID) {
    console.error('OpenAI client not configured');
    return NextResponse.json({ 
      error: 'OpenAI Assistant not available', 
      details: 'Azure OpenAI credentials not configured. Please use the Azure AI Agent instead.',
      suggestion: 'Try switching to the Azure AI Agent using the toggle in the header.'
    }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { message, resetConversation } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get session ID from cookie or generate new one
    const cookies = request.headers.get('cookie') || '';
    const sessionMatch = cookies.match(/sessionId=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log('Session ID:', sessionId);

    // Reset conversation if requested
    if (resetConversation) {
      conversationThreads.delete(sessionId);
      console.log('Conversation reset for session:', sessionId);
    }

    // Get or create thread for this session
    let conversationThread = conversationThreads.get(sessionId);

    if (!conversationThread) {
      console.log('Creating new conversation thread for session:', sessionId);
      conversationThread = await client.beta.threads.create();
      conversationThreads.set(sessionId, conversationThread);
      cleanupOldThreads();
      console.log('Thread created:', conversationThread.id);
    } else {
      console.log('Using existing thread:', conversationThread.id);
    }

    await client.beta.threads.messages.create(conversationThread.id, {
      role: "user",
      content: `User question: "${message}"

IMPORTANT: Provide your response in TWO clearly separated parts:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 - SYNTHESIZED ANSWER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANSWER:
[Provide a concise, clear 2-3 sentence direct answer to the user's question. This should be factual, specific, and immediately useful. Base this answer ONLY on the official PolicyTech document content.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 - SOURCE DOCUMENT EVIDENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FULL_POLICY_DOCUMENT:
[Complete Rush PolicyTech document in its native format. Format the response EXACTLY as it appears in the official PolicyTech PDF document, including:

REQUIRED DOCUMENT STRUCTURE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RUSH UNIVERSITY SYSTEM FOR HEALTH

Policy Title: [Exact Policy Title from PolicyTech]
Policy Number: [e.g., OP-0517]
Reference Number: [e.g., 369]

Document Owner: [Name]
Approver(s): [Name]

Date Created: [MM/DD/YYYY]
Date Approved: [MM/DD/YYYY]
Date Updated: [MM/DD/YYYY]
Review Due: [MM/DD/YYYY]

Applies To: RUMC ☒ RUMG ☐ ROPH ☐ RCMC ☐ RCH ☐ ROPPG ☐ RCMG ☐
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL METADATA REQUIREMENTS:
You MUST include ALL of the following metadata fields in the header section above, even if some values are unknown:
- Policy Title (REQUIRED - never omit, this is the document title)
- Policy Number (REQUIRED - use "Not specified" if unknown)
- Reference Number (use "Not specified" if unknown)
- Document Owner (use "Not specified" if unknown)
- Approver(s) (REQUIRED - use "Not specified" if unknown)
- Date Created (use "Not specified" if unknown)
- Date Approved (use "Not specified" if unknown)
- Date Updated (use "Not specified" if unknown)
- Review Due (use "Not specified" if unknown)
- Applies To (REQUIRED - list all Rush facilities with checkboxes: RUMC, RUMG, ROPH, RCMC, RCH, ROPPG, RCMG)

If any field is not available in the PolicyTech document, write "Not specified" - NEVER omit the field label and value entirely.
The metadata table MUST always be complete with all fields present.

NOTE: These policies contain official Rush University Medical Center guidance and procedures.
The "Applies To" section indicates which Rush facilities this policy covers:
- RUMC = Rush University Medical Center
- RUMG = Rush University Medical Group
- ROPH = Rush Oak Park Hospital
- RCMC = Rush Copley Medical Center
- RCH = Rush Children's Hospital
- ROPPG = Rush Oak Park Physicians Group
- RCMG = Rush Copley Medical Group

I. Policy
[Numbered policy statements exactly as they appear in PolicyTech]

II. Definitions
[All definitions exactly as listed in PolicyTech]

III. Procedure
[Complete procedure section with equipment lists and step-by-step instructions]

IV. Attachments
[List all appendices and attachments]

V. Related Policies or Clinical Resources
[List all related policies with hyperlinks]

VI. References and Regulatory References
[All references and citations]

IMPORTANT FORMATTING RULES:
1. Use the EXACT section numbering from the original PolicyTech document
2. Include ALL metadata (dates, approver, document owner, etc.)
3. Keep the formal "Applies To" checkboxes
4. Include the complete document - do not summarize or truncate]`
    });

    const run = await client.beta.threads.runs.create(conversationThread.id, {
      assistant_id: ASSISTANT_ID
    });
    console.log('Run started:', run.id);

    let runStatus = await client.beta.threads.runs.retrieve(conversationThread.id, run.id);
    let attempts = 0;
    const maxAttempts = 30;

    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await client.beta.threads.runs.retrieve(conversationThread.id, run.id);
      attempts++;

      if (attempts % 5 === 0) {
        console.log(`Still processing... (${attempts}s)`);
      }
    }

    console.log('Final run status:', runStatus.status);

    if (runStatus.status === 'completed') {
      const messages = await client.beta.threads.messages.list(conversationThread.id);
      const assistantMessage = messages.data.find(m => m.role === 'assistant');

      if (assistantMessage && assistantMessage.content[0]) {
        const responseText = assistantMessage.content[0].text.value;
        console.log('Response length:', responseText.length, 'characters');

        // Set session cookie for thread persistence
        const response = NextResponse.json({ response: responseText });
        response.cookies.set('sessionId', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 // 24 hours
        });

        return response;
      } else {
        console.error('No assistant message found');
        return NextResponse.json({ error: 'No response from assistant' }, { status: 500 });
      }
    } else if (runStatus.status === 'failed') {
      console.error('Run failed:', runStatus.last_error);
      return NextResponse.json({ 
        error: 'Assistant run failed', 
        details: runStatus.last_error 
      }, { status: 500 });
    } else {
      console.error('Run timed out or unexpected status:', runStatus.status);
      return NextResponse.json({ 
        error: `Run ended with status: ${runStatus.status}`,
        details: 'The assistant took too long to respond. Please try again.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('API Error:', error);

    // Check for specific Azure connection errors
    if (error.message && error.message.includes('ENOTFOUND')) {
      return NextResponse.json({ 
        error: 'Azure connection failed',
        details: 'Cannot reach Azure OpenAI endpoint. This might be due to network restrictions.',
        hint: 'Azure firewall may be blocking Vercel IPs'
      }, { status: 500 });
    }

    if (error.status === 401) {
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: 'Azure OpenAI API key is invalid or expired',
        hint: 'Check your API key in Vercel environment variables'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error.message,
      errorType: error.constructor.name,
      hint: 'Check server logs for more details'
    }, { status: 500 });
  }
}