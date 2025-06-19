import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT, 
  apiVersion: "2024-05-01-preview"
});

const ASSISTANT_ID = process.env.ASSISTANT_ID;

export async function POST(request) {
  console.log('API Route called:', new Date().toISOString());
  
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('Creating thread for message:', message.substring(0, 50) + '...');

    const thread = await client.beta.threads.create();
    console.log('Thread created:', thread.id);

    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    });

    const run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });
    console.log('Run started:', run.id);

    let runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 30;
    
    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`Still processing... (${attempts}s)`);
      }
    }

    console.log('Final run status:', runStatus.status);

    if (runStatus.status === 'completed') {
      const messages = await client.beta.threads.messages.list(thread.id);
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
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error.message,
      hint: 'Check server logs for more details'
    }, { status: 500 });
  }
}