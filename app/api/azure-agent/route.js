import { NextResponse } from 'next/server';
import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';
import { AZURE_CONFIG, PERFORMANCE, ERROR_MESSAGES, SESSION_CONFIG } from '../../constants';

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

export async function POST(request) {
  console.log('Azure AI Agent API Route called:', new Date().toISOString());

  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: ERROR_MESSAGES.MESSAGE_REQUIRED }, { status: 400 });
    }

    // CRITICAL FOR RAG ACCURACY: Always create a fresh thread for each question
    // This ensures the Azure AI Agent performs a fresh search in the RAG database
    // instead of relying on previous conversation context, which prevents:
    // 1. Hallucinations from previous responses
    // 2. Incorrect answers from conversation bleed-over
    // 3. Stale information from earlier in the conversation
    //
    // DO NOT store threads in the map - we want ZERO conversation history
    // Every question must trigger a fresh RAG database search

    console.log('Creating new conversation thread for fresh RAG search (stateless mode)');
    const conversationThread = await project.agents.threads.create();
    console.log('Fresh thread created:', conversationThread.id);

    // Create message in the thread
    await project.agents.messages.create(
      conversationThread.id,
      "user",
      `User question: "${message}"

⚠️ CRITICAL RAG REQUIREMENTS - ZERO HALLUCINATION POLICY ⚠️

You are a factual policy retrieval system. You MUST:
1. Search the RAG database for every question - NEVER rely on memory or previous context
2. ONLY quote directly from retrieved PolicyTech documents - NEVER paraphrase, summarize, or infer
3. DO NOT rephrase or rewrite policy text - extract verbatim quotes only
4. If information is not in the RAG database, respond EXACTLY: "I cannot find this information in the Rush PolicyTech database. Please contact PolicyTech directly."
5. NEVER make up policy numbers, dates, approvers, or any other details
6. NEVER use information from previous questions in this conversation
7. Extract text EXACTLY as written in the source documents - word-for-word, character-for-character
8. ALWAYS include citation marks 【source†file.pdf】 for every factual statement
9. If uncertain about any detail, state "This information is not specified in the PolicyTech document" rather than guessing

FORBIDDEN PHRASES (these indicate hallucination):
- "Based on my knowledge..."
- "I believe..."
- "Typically..."
- "Usually..."
- "Generally speaking..."
- "In my experience..."

IMPORTANT: Provide your response in TWO clearly separated parts:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 - SYNTHESIZED ANSWER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANSWER:
[Provide a concise, clear 2-3 sentence direct answer USING ONLY EXACT QUOTES from the PolicyTech documents you retrieved. This should be factual, literal, and specific - answer exactly what was asked based ONLY on the official PolicyTech document content you just searched for. DO NOT paraphrase - copy text verbatim. DO NOT use ** markdown formatting. Use plain text with italic formatting only for policy titles. Include citation marks 【source†file.pdf】 for every statement. If the answer is not in the retrieved documents, state "I cannot find this information in the Rush PolicyTech database."]

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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I. Policy

[Numbered policy statements exactly as they appear in PolicyTech, maintaining:
- Roman numerals for main sections (I, II, III, IV, V, VI)
- Arabic numbers for policy points (1, 2, 3, etc.)
- Lowercase letters for sub-points (a, b, c, etc.)
- Lowercase roman numerals for nested points (i, ii, iii, etc.)
- Bold formatting for section headers
- Exact indentation and structure]

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT FORMATTING RULES:
1. Use the EXACT section numbering from the original PolicyTech document
2. Preserve all bullet point styles (•, ○, checkboxes ☐ ☒)
3. Maintain indentation hierarchy
4. Include ALL metadata (dates, approver, document owner, etc.)
5. Keep the formal "Applies To" checkboxes
6. Use section dividers (━━━) for visual clarity
7. Bold all section headers (I. Policy, II. Definitions, etc.)
8. Include "Printed copies are for reference only" notice if in original
9. Preserve any tables, lists, or special formatting
10. Include the complete document - do not summarize or truncate

This should look EXACTLY like the official Rush PolicyTech PDF document when displayed.`
    );

    // Create run
    let run = await project.agents.runs.create(conversationThread.id, AGENT_ID);

    // Poll until the run reaches a terminal status
    while (run.status === "queued" || run.status === "in_progress") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await project.agents.runs.get(conversationThread.id, run.id);
    }

    console.log('Run status:', run.status);

    if (run.status === "failed") {
      console.error('Run failed:', run.lastError);
      return NextResponse.json({ 
        error: 'Agent run failed', 
        details: run.lastError 
      }, { status: 500 });
    }

    // Retrieve messages
    const messages = await project.agents.messages.list(conversationThread.id, { order: "asc" });

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

    if (assistantResponse) {
      console.log('Response length:', assistantResponse.length, 'characters');

      // Ensure the response is a valid string and doesn't break JSON
      let cleanResponse = typeof assistantResponse === 'string'
        ? assistantResponse
        : String(assistantResponse);

      // Post-processing: Clean formatting while preserving structure

      // Step 1: Extract all citation marks before removing them
      const citations = [];
      const citationRegex = /【([^】]+)】/g;
      let match;
      while ((match = citationRegex.exec(cleanResponse)) !== null) {
        citations.push(match[1]); // Store the citation content
      }

      // Step 2: Clean formatting ONLY (keep PART 1 and PART 2 structure)
      cleanResponse = cleanResponse
        // Remove citation marks from body (will add at bottom)
        .replace(/【[^】]+】/g, '')
        // Remove ** markdown bold markers
        .replace(/\*\*/g, '')
        // Clean up excessive whitespace
        .replace(/\n\n\n+/g, '\n\n')                  // Reduce triple+ newlines to double
        .replace(/(?<=\n)\s+(?=\n)/g, '')             // Remove whitespace-only lines
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

      console.log('Cleaned response length:', cleanResponse.length, 'characters');
      console.log('Citations extracted:', citations.length);

      // ═══════════════════════════════════════════════════════════════════════════════
      // RAG ACCURACY MONITORING
      // ═══════════════════════════════════════════════════════════════════════════════
      // Validate response quality to detect potential hallucinations

      // 1. Citation count validation
      if (citations.length === 0) {
        console.warn('⚠️ RAG WARNING: No citations found in response - possible hallucination');
      } else {
        console.log('✅ RAG VALIDATION: Found', citations.length, 'citations');
      }

      // 2. Fresh thread confirmation
      console.log('✅ RAG VALIDATION: Fresh thread created for this request (ID:', conversationThread.id, ')');

      // 3. Response structure validation
      const hasPart1 = cleanResponse.includes('SYNTHESIZED ANSWER') || cleanResponse.includes('ANSWER:');
      const hasPart2 = cleanResponse.includes('FULL_POLICY_DOCUMENT') || cleanResponse.includes('RUSH UNIVERSITY SYSTEM FOR HEALTH');

      if (!hasPart1 || !hasPart2) {
        console.warn('⚠️ RAG WARNING: Response missing expected structure (Part 1:', hasPart1, ', Part 2:', hasPart2, ')');
      } else {
        console.log('✅ RAG VALIDATION: Response has correct two-part structure');
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
        console.warn('⚠️ RAG WARNING: Response contains suspicious phrases:', foundSuspicious);
      }

      // Return response (stateless - no session cookies needed)
      return NextResponse.json({ response: cleanResponse });
    } else {
      console.error('No assistant response found');
      return NextResponse.json({ error: ERROR_MESSAGES.NO_RESPONSE_AGENT }, { status: 500 });
    }

  } catch (error) {
    console.error('Azure AI Agent API Error:', error);

    // Check for specific Azure connection errors
    if (error.message && error.message.includes('ENOTFOUND')) {
      return NextResponse.json({
        error: ERROR_MESSAGES.AZURE_CONNECTION_FAILED,
        details: ERROR_MESSAGES.AZURE_FIREWALL,
        hint: 'Azure firewall may be blocking requests'
      }, { status: 500 });
    }

    if (error.status === 401) {
      return NextResponse.json({
        error: ERROR_MESSAGES.AUTH_FAILED,
        details: 'Azure AI credentials are invalid or expired',
        hint: 'Check your Azure credentials and endpoint configuration'
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
