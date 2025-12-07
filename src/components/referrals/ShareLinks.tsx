'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { 
  Copy, 
  Check, 
  Share2, 
  Mail, 
  MessageSquare,
  Twitter,
  Facebook,
  Linkedin
} from 'lucide-react'

interface ShareLinksProps {
  referralCode: string
  referralLink: string
}

export function ShareLinks({ referralCode, referralLink }: ShareLinksProps) {
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const { toast } = useToast()

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast({ title: 'Link copied to clipboard!' })
    setTimeout(() => setCopied(false), 2000)
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(referralCode)
    setCopiedCode(true)
    toast({ title: 'Code copied to clipboard!' })
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const shareMessage = `I've been using NeverMiss AI to automate my business calls - it's amazing! Use my link to get $50 off: ${referralLink}`

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Check out NeverMiss AI - AI Phone System for Service Businesses")
    const body = encodeURIComponent(shareMessage)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const shareViaSMS = () => {
    const body = encodeURIComponent(shareMessage)
    window.open(`sms:?body=${body}`)
  }

  const shareViaTwitter = () => {
    const text = encodeURIComponent(shareMessage)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  const shareViaFacebook = () => {
    const url = encodeURIComponent(referralLink)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
  }

  const shareViaLinkedIn = () => {
    const url = encodeURIComponent(referralLink)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Your Referral Link
        </CardTitle>
        <CardDescription>
          Share this link with other pressure washing businesses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Unique Link</label>
          <div className="flex gap-2">
            <Input 
              readOnly 
              value={referralLink}
              className="font-mono text-sm"
            />
            <Button onClick={copyLink} variant="outline">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Referral Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Code</label>
          <div className="flex gap-2">
            <div className="flex-1 px-4 py-2 bg-muted rounded-lg font-mono font-bold text-lg text-center">
              {referralCode}
            </div>
            <Button onClick={copyCode} variant="outline">
              {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            They can also use this code when signing up
          </p>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Share via</label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={shareViaEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={shareViaSMS}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Text
            </Button>
            <Button variant="outline" size="sm" onClick={shareViaTwitter}>
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button variant="outline" size="sm" onClick={shareViaFacebook}>
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button variant="outline" size="sm" onClick={shareViaLinkedIn}>
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
          </div>
        </div>

        {/* Pre-written message */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Suggested message:</p>
          <p className="text-sm text-muted-foreground italic">
            "{shareMessage}"
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

