import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Rush Policy Chat Assistant is running',
    timestamp: new Date().toISOString()
  });
}