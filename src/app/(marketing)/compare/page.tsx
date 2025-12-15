import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Compare FusionCaller vs Competitors | FusionCaller',
  description: 'See how FusionCaller compares to other AI phone solutions',
}

const competitors = [
  {
    name: 'Bluzi',
    url: 'https://bluzi.ai',
    comparison: {
      '24/7 AI Receptionist': { fusioncaller: true, competitor: true },
      'Outbound Campaigns': { fusioncaller: true, competitor: false },
      'CRM Integration': { fusioncaller: true, competitor: true },
      'Call Recording': { fusioncaller: true, competitor: true },
      'Multi-language': { fusioncaller: true, competitor: true },
      'Sentiment Analysis': { fusioncaller: true, competitor: false },
      'Topic Extraction': { fusioncaller: true, competitor: false },
      'Done-For-You Setup': { fusioncaller: true, competitor: false },
      'Phone Number Management': { fusioncaller: true, competitor: false },
      'Zapier Integration': { fusioncaller: true, competitor: false },
    },
  },
  {
    name: 'Simpletalk',
    url: 'https://simpletalk.ai',
    comparison: {
      '24/7 AI Receptionist': { fusioncaller: true, competitor: true },
      'Outbound Campaigns': { fusioncaller: true, competitor: false },
      'CRM Integration': { fusioncaller: true, competitor: true },
      'Call Recording': { fusioncaller: true, competitor: true },
      'Multi-language': { fusioncaller: true, competitor: true },
      'Sentiment Analysis': { fusioncaller: true, competitor: false },
      'Topic Extraction': { fusioncaller: true, competitor: false },
      'Done-For-You Setup': { fusioncaller: true, competitor: false },
      'Phone Number Management': { fusioncaller: true, competitor: false },
      'Zapier Integration': { fusioncaller: true, competitor: false },
    },
  },
  {
    name: 'CloudTalk',
    url: 'https://cloudtalk.io',
    comparison: {
      '24/7 AI Receptionist': { fusioncaller: true, competitor: true },
      'Outbound Campaigns': { fusioncaller: true, competitor: true },
      'CRM Integration': { fusioncaller: true, competitor: true },
      'Call Recording': { fusioncaller: true, competitor: true },
      'Multi-language': { fusioncaller: true, competitor: true },
      'Sentiment Analysis': { fusioncaller: true, competitor: true },
      'Topic Extraction': { fusioncaller: true, competitor: true },
      'Done-For-You Setup': { fusioncaller: true, competitor: false },
      'Phone Number Management': { fusioncaller: true, competitor: true },
      'Zapier Integration': { fusioncaller: true, competitor: true },
      'Price Point': { fusioncaller: '$$', competitor: '$$$' },
    },
  },
]

const features = Object.keys(competitors[0].comparison)

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Comparison</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              FusionCaller vs Competitors
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how we stack up against other AI phone solutions
            </p>
          </div>

          <div className="space-y-12">
            {competitors.map((competitor) => (
              <Card key={competitor.name}>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    FusionCaller vs {competitor.name}
                  </CardTitle>
                  <CardDescription>
                    <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Visit {competitor.name} website <ArrowRight className="inline h-3 w-3" />
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Feature</th>
                          <th className="text-center py-3 px-4 font-semibold">FusionCaller</th>
                          <th className="text-center py-3 px-4 font-semibold">{competitor.name}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {features.map((feature) => {
                          const comparison = competitor.comparison[feature]
                          if (!comparison) return null

                          const fusionValue = comparison.fusioncaller
                          const competitorValue = comparison.competitor

                          return (
                            <tr key={feature} className="border-b hover:bg-muted/50">
                              <td className="py-4 px-4">{feature}</td>
                              <td className="text-center py-4 px-4">
                                {typeof fusionValue === 'boolean' ? (
                                  fusionValue ? (
                                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                                  ) : (
                                    <X className="h-5 w-5 text-red-500 mx-auto" />
                                  )
                                ) : (
                                  <span className="font-medium">{fusionValue}</span>
                                )}
                              </td>
                              <td className="text-center py-4 px-4">
                                {typeof competitorValue === 'boolean' ? (
                                  competitorValue ? (
                                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                                  ) : (
                                    <X className="h-5 w-5 text-red-500 mx-auto" />
                                  )
                                ) : (
                                  <span className="font-medium">{competitorValue}</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <Card className="mt-16 bg-gradient-to-r from-primary to-primary/80 text-white border-0">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join the businesses choosing FusionCaller
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/#pricing">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

