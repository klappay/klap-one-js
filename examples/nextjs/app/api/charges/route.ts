import { createDemoCharge } from '@/lib/create-demo-charge'
import { klap } from '@/lib/klap'
import { NextResponse } from 'next/server'

export async function POST() {
  const result = await createDemoCharge(klap.charges)
  return NextResponse.json(result)
}
