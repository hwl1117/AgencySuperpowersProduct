import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'VideoBrain Frontend',
    timestamp: new Date().toISOString()
  })
}