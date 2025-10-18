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

/**
 * Streaming API endpoint for Azure AI Agent responses
 * Implements Server-Sent Events (SSE) for real-time progressive rendering
 */
export async function POST(request) {
  console.log('Azure AI Agent Streaming API called:', new Date().toISOString());

  try {
    const body = await request.json();
    const { message, resetConversation } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper function to send SSE events
          const sendEvent = (event, data) => {
            const sseData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          };

          // Send start event
          sendEvent('start', { message: 'Starting agent run' });

          // Create message in the thread with two-part format instructions
          await project.agents.messages.create(
            conversationThread.id,
            "user",
            `User question: "${message}"

IMPORTANT: Provide your response in TWO parts:

PART 1 - QUICK ANSWER:
Start with "ANSWER:" followed by a concise 2-3 sentence direct answer to the user's question. This should be clear, specific, and immediately useful.

PART 2 - FULL POLICY DOCUMENT:
Then provide "FULL_POLICY_DOCUMENT:" followed by the complete Rush PolicyTech document in its native format. Format the response EXACTLY as it appears in the official PolicyTech PDF document, including:

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

[Numbered policy statements exactly as they appear in PolicyTech, maintaining all formatting]

II. Definitions
III. Procedure
IV. Attachments
V. Related Policies or Clinical Resources
VI. References and Regulatory References

This should look EXACTLY like the official Rush PolicyTech PDF document when displayed.`
          );

          // Create run
          let run = await project.agents.runs.create(conversationThread.id, AGENT_ID);
          sendEvent('run-created', { runId: run.id, status: run.status });

          // Poll for run completion with streaming updates
          let lastStatus = run.status;
          let pollCount = 0;
          const MAX_POLLS = 120; // 2 minutes max (120 * 1 second)

          while (run.status === "queued" || run.status === "in_progress") {
            pollCount++;

            if (pollCount > MAX_POLLS) {
              throw new Error('Agent run timed out after 2 minutes');
            }

            // Send progress updates
            if (run.status !== lastStatus) {
              sendEvent('status-update', { status: run.status, pollCount });
              lastStatus = run.status;
            } else if (pollCount % 5 === 0) {
              // Send heartbeat every 5 seconds
              sendEvent('heartbeat', { pollCount, elapsed: pollCount });
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
            run = await project.agents.runs.get(conversationThread.id, run.id);
          }

          console.log('Run completed with status:', run.status);

          if (run.status === "failed") {
            sendEvent('error', {
              error: 'Agent run failed',
              details: run.lastError
            });
            controller.close();
            return;
          }

          // Retrieve messages
          const messages = await project.agents.messages.list(
            conversationThread.id,
            { order: "asc" }
          );

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
            sendEvent('error', { error: 'No response from agent' });
            controller.close();
            return;
          }

          // Stream the response in chunks
          // Parse ANSWER and FULL_POLICY_DOCUMENT sections
          const answerMatch = assistantResponse.match(/ANSWER:\s*([\s\S]*?)(?=FULL_POLICY_DOCUMENT:|$)/i);
          const documentMatch = assistantResponse.match(/FULL_POLICY_DOCUMENT:\s*([\s\S]*)/i);

          const answer = answerMatch ? answerMatch[1].trim() : null;
          const fullDocument = documentMatch ? documentMatch[1].trim() : assistantResponse;

          // Stream answer in chunks
          if (answer) {
            sendEvent('answer-start', { totalChars: answer.length });

            const CHUNK_SIZE = 50; // Characters per chunk
            for (let i = 0; i < answer.length; i += CHUNK_SIZE) {
              const chunk = answer.substring(i, Math.min(i + CHUNK_SIZE, answer.length));
              sendEvent('answer-chunk', {
                chunk,
                progress: Math.min(i + CHUNK_SIZE, answer.length),
                total: answer.length
              });
              // Small delay for smoother streaming effect
              await new Promise(resolve => setTimeout(resolve, 30));
            }

            sendEvent('answer-complete', { answer });
          }

          // Stream document in chunks
          if (fullDocument) {
            sendEvent('document-start', { totalChars: fullDocument.length });

            const DOC_CHUNK_SIZE = 200; // Larger chunks for document
            for (let i = 0; i < fullDocument.length; i += DOC_CHUNK_SIZE) {
              const chunk = fullDocument.substring(i, Math.min(i + DOC_CHUNK_SIZE, fullDocument.length));
              sendEvent('document-chunk', {
                chunk,
                progress: Math.min(i + DOC_CHUNK_SIZE, fullDocument.length),
                total: fullDocument.length
              });
              // Faster streaming for document
              await new Promise(resolve => setTimeout(resolve, 20));
            }

            sendEvent('document-complete', { fullDocument });
          }

          // Send completion event
          sendEvent('done', {
            success: true,
            answerLength: answer?.length || 0,
            documentLength: fullDocument?.length || 0
          });

          controller.close();

        } catch (error) {
          console.error('Streaming error:', error);

          const sendEvent = (event, data) => {
            const sseData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          };

          sendEvent('error', {
            error: error.message,
            errorType: error.constructor.name
          });

          controller.close();
        }
      }
    });

    // Return streaming response with SSE headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable nginx buffering
      }
    });

  } catch (error) {
    console.error('Azure AI Agent Streaming API Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to initialize streaming',
        details: error.message,
        errorType: error.constructor.name
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
