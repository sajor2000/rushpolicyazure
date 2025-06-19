import { NextResponse } from 'next/server';

export async function GET() {
  // Check which environment variables are set (without exposing values)
  const envCheck = {
    deployment: {
      platform: process.env.VERCEL ? 'Vercel' : 'Other',
      nodeVersion: process.version,
      isProduction: process.env.NODE_ENV === 'production',
    },
    azureConfig: {
      AZURE_OPENAI_ENDPOINT: !!process.env.AZURE_OPENAI_ENDPOINT,
      AZURE_OPENAI_API_KEY: !!process.env.AZURE_OPENAI_API_KEY,
      ASSISTANT_ID: !!process.env.ASSISTANT_ID,
      VECTOR_STORE_ID: !!process.env.VECTOR_STORE_ID,
    },
    // Show endpoint (safe to display)
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'NOT SET',
    // Show first 10 chars of API key to verify it's loaded
    apiKeyPreview: process.env.AZURE_OPENAI_API_KEY 
      ? `${process.env.AZURE_OPENAI_API_KEY.substring(0, 10)}...` 
      : 'NOT SET',
    // Test a simple connection
    testResult: 'Check /api/debug for connection test'
  };

  return NextResponse.json(envCheck, {
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}