import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

export async function GET() {
  const diagnostics = {
    environment: {
      AZURE_ENDPOINT_SET: !!process.env.AZURE_OPENAI_ENDPOINT,
      AZURE_KEY_SET: !!process.env.AZURE_OPENAI_API_KEY,
      ASSISTANT_ID_SET: !!process.env.ASSISTANT_ID,
      VECTOR_STORE_ID_SET: !!process.env.VECTOR_STORE_ID,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
    },
    endpoint: process.env.AZURE_OPENAI_ENDPOINT ? 
      process.env.AZURE_OPENAI_ENDPOINT.replace(/https:\/\//, '').replace(/\/$/, '') : 
      'NOT SET',
    timestamp: new Date().toISOString()
  };

  // Try to test Azure connection
  try {
    const client = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: "2024-05-01-preview"
    });

    // Try a simple API call
    const thread = await client.beta.threads.create();
    diagnostics.azureConnection = {
      status: 'SUCCESS',
      threadId: thread.id,
      message: 'Successfully connected to Azure OpenAI'
    };
  } catch (error) {
    diagnostics.azureConnection = {
      status: 'FAILED',
      error: error.message,
      errorType: error.constructor.name,
      errorCode: error.code,
      possibleCauses: [
        'Azure firewall blocking Vercel IPs',
        'API key invalid or expired',
        'Endpoint URL incorrect',
        'Network/CORS restrictions',
        'Azure resource not accessible from internet'
      ]
    };
  }

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}