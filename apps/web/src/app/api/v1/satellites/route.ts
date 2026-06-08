import { NextResponse } from 'next/server';
import { generateSatellites } from '@/lib/data-generators';
import { apiCache } from '@/lib/cache';

export async function GET() {
  const data = await apiCache.wrap('satellites', 60, async () => ({ satellites: generateSatellites() }));
  return NextResponse.json(data);
}