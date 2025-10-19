import { NextResponse } from 'next/server';
import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';

// Initialize Azure AI Project client
const project = new AIProjectClient(
  process.env.AZURE_AI_ENDPOINT || "https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project",
  new DefaultAzureCredential()
);

const AGENT_ID = process.env.AZURE_AI_AGENT_ID || "asst_301EhwakRXWsOCgGQt276WiU";

// In-memory thread storage (in production, use Redis or database)
let conversationThread = null;

export async function POST(request) {
  console.log('Azure AI Agent API Route called:', new Date().toISOString());

  try {
    const body = await request.json();
    const { message, resetConversation } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Reset conversation if requested
    if (resetConversation) {
      conversationThread = null;
    }

    // Create new thread only if one doesn't exist
    if (!conversationThread) {
      console.log('Creating new conversation thread');
      conversationThread = await project.agents.threads.create();
      console.log('Thread created:', conversationThread.id);
    } else {
      console.log('Using existing thread:', conversationThread.id);
    }

    // Create message in the thread
    await project.agents.messages.create(
      conversationThread.id,
      "user",
      `User question: "${message}"

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
      const cleanResponse = typeof assistantResponse === 'string'
        ? assistantResponse
        : String(assistantResponse);

      return NextResponse.json({ response: cleanResponse });
    } else {
      console.error('No assistant response found');
      return NextResponse.json({ error: 'No response from agent' }, { status: 500 });
    }

  } catch (error) {
    console.error('Azure AI Agent API Error:', error);

    // Check for specific Azure connection errors
    if (error.message && error.message.includes('ENOTFOUND')) {
      return NextResponse.json({ 
        error: 'Azure connection failed',
        details: 'Cannot reach Azure AI endpoint. This might be due to network restrictions.',
        hint: 'Azure firewall may be blocking requests'
      }, { status: 500 });
    }

    if (error.status === 401) {
      return NextResponse.json({ 
        error: 'Authentication failed',
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
