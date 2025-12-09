import { NextResponse } from 'next/server'
import { triggerWorkflows } from '@/lib/workflows/engine'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { triggerType, organizationId, ...context } = body

    if (!triggerType || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: triggerType, organizationId' },
        { status: 400 }
      )
    }

    const result = await triggerWorkflows(triggerType, {
      organizationId,
      ...context,
    })

    return NextResponse.json({ success: true, executed: result.executed })
  } catch (error: any) {
    console.error('Workflow execution error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to execute workflows' },
      { status: 500 }
    )
  }
}

