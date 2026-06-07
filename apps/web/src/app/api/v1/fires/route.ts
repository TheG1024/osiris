import { NextResponse } from 'next/server';
import { generateFires } from '@/lib/data-generators';

export async function GET() {
  return NextResponse.json({ fires: generateFires() });
}