import { NextResponse } from 'next/server';
import { generateFires } from '@/lib/data-generators';
import { apiCache } from '@/lib/cache';

export async function GET() {
  const data = await apiCache.wrap('fires', 120, async () => ({ fires: generateFires() }));
  return NextResponse.json(data);
}