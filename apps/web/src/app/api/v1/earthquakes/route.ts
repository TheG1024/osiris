import { NextResponse } from 'next/server';
import { generateEarthquakes } from '@/lib/data-generators';

export async function GET() {
  return NextResponse.json({ earthquakes: generateEarthquakes() });
}