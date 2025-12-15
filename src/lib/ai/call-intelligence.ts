'use server'

import { createActionClient } from '@/lib/supabase/server'
import { analyzeCallSentiment } from './sentiment-analysis'
import { extractCallTopics } from './topic-extraction'
import { generateAINotes } from './ai-notes-generator'

/**
 * Process call intelligence (sentiment, topics, notes) after a call completes
 */
export async function processCallIntelligence(
  callId: string,
  transcript: string,
  summary?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createActionClient()

  if (!transcript || transcript.trim().length < 50) {
    return { success: false, error: 'Transcript too short' }
  }

  try {
    // Analyze sentiment
    const sentimentResult = await analyzeCallSentiment(transcript)
    
    // Extract topics
    const topics = await extractCallTopics(transcript, 5)
    
    // Generate AI notes
    const aiNotes = await generateAINotes(transcript, summary)

    // Calculate talk/listen ratio if available (would need call metadata)
    // For now, we'll leave these as null and calculate from call data if available

    // Update call record
    const updateData: any = {
      intelligence_metadata: {
        processed_at: new Date().toISOString(),
      },
    }

    if (sentimentResult) {
      updateData.sentiment = sentimentResult.sentiment
      updateData.sentiment_score = sentimentResult.score
    }

    if (topics.length > 0) {
      updateData.topics = topics
    }

    if (aiNotes) {
      updateData.ai_notes = JSON.stringify(aiNotes)
      // Also store summary from notes
      if (aiNotes.summary) {
        updateData.summary = aiNotes.summary
      }
    }

    const { error } = await supabase
      .from('calls')
      .update(updateData)
      .eq('id', callId)

    if (error) {
      console.error('Error updating call intelligence:', error)
      return { success: false, error: error.message }
    }

    // Update trending topics (async, don't wait)
    if (topics.length > 0) {
      updateTrendingTopics(callId, topics).catch(err => {
        console.error('Error updating trending topics:', err)
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error('Call intelligence processing error:', error)
    return { success: false, error: error.message || 'Failed to process call intelligence' }
  }
}

/**
 * Update trending topics for an organization
 */
async function updateTrendingTopics(callId: string, topics: any[]): Promise<void> {
  const supabase = createActionClient()

  // Get call and organization
  const { data: call } = await supabase
    .from('calls')
    .select('organization_id')
    .eq('id', callId)
    .single()

  if (!call) return

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  for (const topicData of topics) {
    const topic = topicData.topic || topicData
    const topicStr = typeof topic === 'string' ? topic : topic.toString()

    // Upsert trending topic
    await supabase
      .from('trending_topics')
      .upsert({
        organization_id: call.organization_id,
        topic: topicStr,
        mention_count: 1,
        last_mentioned_at: now.toISOString(),
        time_period: 'daily',
      }, {
        onConflict: 'organization_id,topic,time_period',
      })
      .select()
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          // Increment count if exists
          return supabase
            .from('trending_topics')
            .update({
              mention_count: (data[0].mention_count || 1) + 1,
              last_mentioned_at: now.toISOString(),
            })
            .eq('id', data[0].id)
        }
      })
  }
}

