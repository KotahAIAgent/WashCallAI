'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Tag, 
  FileText, 
  Lightbulb,
  CheckCircle2,
  MessageSquare
} from 'lucide-react'

interface Topic {
  topic: string
  relevance?: number
  category?: string
}

interface AINote {
  summary?: string
  actionItems?: string[]
  keyPoints?: string[]
  nextSteps?: string[]
  tags?: string[]
}

interface CallIntelligenceProps {
  sentiment?: 'positive' | 'neutral' | 'negative' | null
  sentimentScore?: number | null
  topics?: Topic[] | any[] | null
  aiNotes?: string | AINote | null
  talkTimeSeconds?: number | null
  listenTimeSeconds?: number | null
  talkListenRatio?: number | null
}

export function CallIntelligence({
  sentiment,
  sentimentScore,
  topics,
  aiNotes,
  talkTimeSeconds,
  listenTimeSeconds,
  talkListenRatio,
}: CallIntelligenceProps) {
  // Parse AI notes if it's a string
  let parsedNotes: AINote | null = null
  if (aiNotes) {
    if (typeof aiNotes === 'string') {
      try {
        parsedNotes = JSON.parse(aiNotes)
      } catch {
        // If it's not JSON, treat it as a summary
        parsedNotes = { summary: aiNotes }
      }
    } else {
      parsedNotes = aiNotes as AINote
    }
  }

  // Normalize topics array
  const topicsArray: Topic[] = topics ? (Array.isArray(topics) ? topics : []) : []

  // Get sentiment color and icon
  const getSentimentDisplay = () => {
    if (!sentiment) return null

    const score = sentimentScore || 0
    const isPositive = sentiment === 'positive' || score > 0.2
    const isNegative = sentiment === 'negative' || score < -0.2

    if (isPositive) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: TrendingUp,
        label: 'Positive',
      }
    } else if (isNegative) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: TrendingDown,
        label: 'Negative',
      }
    } else {
      return {
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: Minus,
        label: 'Neutral',
      }
    }
  }

  const sentimentDisplay = getSentimentDisplay()

  return (
    <div className="space-y-4">
      {/* Sentiment */}
      {sentimentDisplay && (
        <Card className={sentimentDisplay.borderColor}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <sentimentDisplay.icon className={`h-5 w-5 ${sentimentDisplay.color}`} />
              Call Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${sentimentDisplay.bgColor} p-4 rounded-lg`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${sentimentDisplay.color}`}>
                  {sentimentDisplay.label}
                </span>
                {sentimentScore !== null && sentimentScore !== undefined && (
                  <Badge variant="outline">
                    {(sentimentScore * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
              {sentimentScore !== null && sentimentScore !== undefined && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${sentimentDisplay.color.replace('text-', 'bg-')}`}
                      style={{
                        width: `${Math.abs(sentimentScore) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topics */}
      {topicsArray.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Key Topics
            </CardTitle>
            <CardDescription>Topics discussed during the call</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topicsArray.map((topic, idx) => {
                const topicText = typeof topic === 'string' ? topic : topic.topic || topic.toString()
                return (
                  <Badge key={idx} variant="secondary" className="text-sm">
                    {topicText}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Talk/Listen Ratio */}
      {talkListenRatio !== null && talkListenRatio !== undefined && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Talk/Listen Ratio
            </CardTitle>
            <CardDescription>Communication balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Talk Time</span>
                <span className="font-medium">
                  {talkTimeSeconds ? `${Math.round(talkTimeSeconds / 60)}m ${talkTimeSeconds % 60}s` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Listen Time</span>
                <span className="font-medium">
                  {listenTimeSeconds ? `${Math.round(listenTimeSeconds / 60)}m ${listenTimeSeconds % 60}s` : 'N/A'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-medium">Ratio</span>
                <Badge variant={talkListenRatio > 1 ? 'default' : 'secondary'}>
                  {talkListenRatio.toFixed(2)}:1
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Notes */}
      {parsedNotes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI-Generated Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedNotes.summary && (
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Summary
                </div>
                <p className="text-sm text-muted-foreground">{parsedNotes.summary}</p>
              </div>
            )}

            {parsedNotes.keyPoints && parsedNotes.keyPoints.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Key Points</div>
                <ul className="space-y-1">
                  {parsedNotes.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {parsedNotes.actionItems && parsedNotes.actionItems.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Action Items
                </div>
                <ul className="space-y-1">
                  {parsedNotes.actionItems.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {parsedNotes.nextSteps && parsedNotes.nextSteps.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Next Steps</div>
                <ul className="space-y-1">
                  {parsedNotes.nextSteps.map((step, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">→</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {parsedNotes.tags && parsedNotes.tags.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {parsedNotes.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

