import { NextResponse } from 'next/server';
import { generateShips } from '@/lib/data-generators';

export async function GET() {
  return NextResponse.json({ ships: generateShips() });
}