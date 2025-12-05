import { NextResponse } from 'next/server'
import { sendAllWeeklyReports } from '@/lib/email/weekly-report'

// This endpoint should be called by a cron job every Monday morning
// Example: Vercel Cron or external service like cron-job.org

export async function GET(request: Request) {
  // Verify cron secret (prevent unauthorized access)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sendAllWeeklyReports()
    
    return NextResponse.json({
      success: true,
      message: `Weekly reports sent`,
      sent: result.sent,
      total: result.total,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error sending weekly reports:', error)
    return NextResponse.json(
      { error: 'Failed to send weekly reports' },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: Request) {
  return GET(request)
}

