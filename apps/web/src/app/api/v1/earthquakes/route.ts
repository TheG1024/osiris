import { NextResponse } from 'next/server';
import { generateEarthquakes } from '@/lib/data-generators';
import { apiCache } from '@/lib/cache';

export async function GET() {
  const data = await apiCache.wrap('earthquakes', 120, async () => ({ earthquakes: generateEarthquakes() }));
  return NextResponse.json(data);
}