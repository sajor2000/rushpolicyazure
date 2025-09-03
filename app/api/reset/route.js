import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // This endpoint is for resetting conversation state
    // In production, you'd clear the user's session/thread from database
    return NextResponse.json({ success: true, message: 'Conversation reset' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset conversation' }, { status: 500 });
  }
}