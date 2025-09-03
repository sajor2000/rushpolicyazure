import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT, 
  apiVersion: "2024-05-01-preview"
});

const ASSISTANT_ID = process.env.ASSISTANT_ID;

// In-memory thread storage (in production, use Redis or database)
let conversationThread = null;

export async function POST(request) {
  console.log('API Route called:', new Date().toISOString());

  // Check if environment variables are set
  if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
    console.error('Missing Azure OpenAI configuration');
    return NextResponse.json({ 
      error: 'Server configuration error', 
      details: 'Azure OpenAI credentials not configured'
    }, { status: 500 });
  }

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
      conversationThread = await client.beta.threads.create();
      console.log('Thread created:', conversationThread.id);
    } else {
      console.log('Using existing thread:', conversationThread.id);
    }

    await client.beta.threads.messages.create(conversationThread.id, {
      role: "user",
      content: `Please provide information about: "${message}"

Respond in this exact format:

SYNTHESIZED_ANSWER:
[Provide a conservative, factual answer to the specific question in 2-3 paragraphs maximum. Be direct, conservative, and factual with no creativity. Answer only what was asked.]

FULL_POLICY_DOCUMENT:
[Provide the complete, exact policy document text as it appears in PolicyTech. Include all original formatting, section numbers, headers, effective dates, policy numbers, and exact language. This should be a verbatim copy of the original document.]`
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
        const response = assistantMessage.content[0].text.value;
        console.log('Response length:', response.length, 'characters');
        return NextResponse.json({ response });
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