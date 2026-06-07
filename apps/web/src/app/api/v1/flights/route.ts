import { NextResponse } from 'next/server';
import { generateFlights } from '@/lib/data-generators';

export async function GET() {
  return NextResponse.json({ flights: generateFlights() });
}