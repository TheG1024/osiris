import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy', 
    service: 'osiris-web', 
    timestamp: Date.now() 
  });
}