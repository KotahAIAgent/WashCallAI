'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/activity/actions'

interface ScoreFactors {
  hasPhone: boolean
  hasEmail: boolean
  hasAddress: boolean
  interestLevel: 'high' | 'medium' | 'low' | 'none'
  propertyType: 'commercial' | 'residential' | 'unknown'
  callCount: number
  responded: boolean
  bookedAppointment: boolean
  statusScore: number
}

// Calculate lead score based on various factors
export async function calculateLeadScore(leadId: string): Promise<{
  score: number
  factors: ScoreFactors
}> {
  const supabase = createActionClient()

  // Get lead data
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (!lead) {
    return { score: 0, factors: getEmptyFactors() }
  }

  // Get calls for this lead
  const { data: calls } = await supabase
    .from('calls')
    .select('status, duration_seconds')
    .eq('lead_id', leadId)

  // Get appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id')
    .eq('lead_id', leadId)

  // Calculate score factors
  const factors: ScoreFactors = {
    hasPhone: !!lead.phone,
    hasEmail: !!lead.email,
    hasAddress: !!lead.address,
    interestLevel: getInterestLevel(lead.status),
    propertyType: lead.property_type || 'unknown',
    callCount: calls?.length || 0,
    responded: calls?.some(c => c.status === 'answered' || c.status === 'completed') || false,
    bookedAppointment: (appointments?.length || 0) > 0,
    statusScore: getStatusScore(lead.status),
  }

  // Calculate final score (0-100)
  let score = 0

  // Contact info (up to 20 points)
  if (factors.hasPhone) score += 10
  if (factors.hasEmail) score += 5
  if (factors.hasAddress) score += 5

  // Interest level (up to 30 points)
  switch (factors.interestLevel) {
    case 'high': score += 30; break
    case 'medium': score += 20; break
    case 'low': score += 10; break
    default: score += 0
  }

  // Property type (up to 10 points)
  switch (factors.propertyType) {
    case 'commercial': score += 10; break // Commercial usually = bigger jobs
    case 'residential': score += 7; break
    default: score += 3
  }

  // Engagement (up to 20 points)
  if (factors.responded) score += 10
  if (factors.callCount >= 2) score += 5
  else if (factors.callCount >= 1) score += 3

  // Booked appointment is huge (20 points)
  if (factors.bookedAppointment) score += 20

  // Status-based adjustment
  score += factors.statusScore

  // Cap at 100
  score = Math.min(score, 100)

  return { score, factors }
}

function getInterestLevel(status: string): ScoreFactors['interestLevel'] {
  switch (status) {
    case 'interested':
    case 'booked':
    case 'customer':
      return 'high'
    case 'call_back':
      return 'medium'
    case 'new':
      return 'low'
    case 'not_interested':
    default:
      return 'none'
  }
}

function getStatusScore(status: string): number {
  switch (status) {
    case 'customer': return 10
    case 'booked': return 8
    case 'interested': return 5
    case 'call_back': return 3
    case 'new': return 0
    case 'not_interested': return -10
    default: return 0
  }
}

function getEmptyFactors(): ScoreFactors {
  return {
    hasPhone: false,
    hasEmail: false,
    hasAddress: false,
    interestLevel: 'none',
    propertyType: 'unknown',
    callCount: 0,
    responded: false,
    bookedAppointment: false,
    statusScore: 0,
  }
}

// Update a lead's score
export async function updateLeadScore(leadId: string) {
  const supabase = createActionClient()

  const { score, factors } = await calculateLeadScore(leadId)

  const { data: lead } = await supabase
    .from('leads')
    .select('organization_id, score')
    .eq('id', leadId)
    .single()

  if (!lead) {
    return { error: 'Lead not found' }
  }

  const previousScore = lead.score || 0

  const { error } = await supabase
    .from('leads')
    .update({
      score,
      score_factors: factors,
      last_scored_at: new Date().toISOString(),
    })
    .eq('id', leadId)

  if (error) {
    return { error: error.message }
  }

  // Log if score changed significantly (by 10+ points)
  if (Math.abs(score - previousScore) >= 10) {
    await logActivity({
      organizationId: lead.organization_id,
      leadId,
      type: 'score_updated',
      title: `Lead score ${score > previousScore ? 'increased' : 'decreased'}`,
      description: `Score changed from ${previousScore} to ${score}`,
      metadata: { previousScore, newScore: score, factors },
    })
  }

  return { score, factors }
}

// Batch update scores for all leads in an organization
export async function updateAllLeadScores(organizationId: string) {
  const supabase = createActionClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('id')
    .eq('organization_id', organizationId)

  if (!leads) {
    return { updated: 0 }
  }

  let updated = 0
  for (const lead of leads) {
    const result = await updateLeadScore(lead.id)
    if (!result.error) {
      updated++
    }
  }

  revalidatePath('/app/leads')
  return { updated }
}

// Get score breakdown description
export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Hot', color: 'text-red-600 bg-red-100' }
  if (score >= 60) return { label: 'Warm', color: 'text-orange-600 bg-orange-100' }
  if (score >= 40) return { label: 'Lukewarm', color: 'text-yellow-600 bg-yellow-100' }
  if (score >= 20) return { label: 'Cool', color: 'text-blue-600 bg-blue-100' }
  return { label: 'Cold', color: 'text-gray-600 bg-gray-100' }
}

