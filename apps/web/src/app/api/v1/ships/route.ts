import { NextResponse } from 'next/server';
import { generateShips } from '@/lib/data-generators';
import { apiCache } from '@/lib/cache';

export async function GET() {
  const data = await apiCache.wrap('ships', 30, async () => ({ ships: generateShips() }));
  return NextResponse.json(data);
}