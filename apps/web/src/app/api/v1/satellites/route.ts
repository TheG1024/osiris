import { NextResponse } from 'next/server';
import { generateSatellites } from '@/lib/data-generators';

export async function GET() {
  return NextResponse.json({ satellites: generateSatellites() });
}