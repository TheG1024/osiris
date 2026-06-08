import { NextResponse } from 'next/server';
import { generateFlights } from '@/lib/data-generators';
import { apiCache } from '@/lib/cache';

export async function GET() {
  const data = await apiCache.wrap('flights', 30, async () => ({ flights: generateFlights() }));
  return NextResponse.json(data);
}