import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, FileText } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | NeverMiss AI',
  description: 'Terms of Service for NeverMiss AI',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-teal-600" />
              <h1 className="text-4xl font-bold">Terms of Service</h1>
            </div>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <Card>
            <CardContent className="p-8 space-y-8">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to NeverMiss AI. These Terms of Service ("Terms") govern your access to and use of 
                  our AI-powered call answering and outbound calling services ("Service"). By accessing or using 
                  our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, 
                  you may not access the Service.
                </p>
              </section>

              {/* Acceptance */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  By creating an account, subscribing to our Service, or using any of our features, you acknowledge 
                  that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  You must be at least 18 years old to use our Service. By using the Service, you represent and 
                  warrant that you meet this age requirement.
                </p>
              </section>

              {/* Services Description */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Description of Services</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  NeverMiss AI provides AI-powered call answering and outbound calling services for businesses. 
                  Our Service includes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>24/7 AI receptionist that answers incoming calls</li>
                  <li>Lead capture and management</li>
                  <li>Appointment scheduling</li>
                  <li>Outbound calling campaigns</li>
                  <li>Call recording and transcription</li>
                  <li>Analytics and reporting</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  We reserve the right to modify, suspend, or discontinue any part of the Service at any time 
                  with or without notice.
                </p>
              </section>

              {/* User Accounts */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">4. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To use our Service, you must create an account and provide accurate, complete, and current 
                  information. You are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                  <li>Ensuring your contact information is kept up to date</li>
                </ul>
              </section>

              {/* Payment Terms */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Subscription fees are billed in advance on a monthly or annual basis. By subscribing, you 
                  authorize us to charge your payment method for all fees associated with your subscription.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong>Fees:</strong> All fees are non-refundable except as required by law. We reserve the 
                  right to change our pricing with 30 days' notice to existing customers.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Free Trials:</strong> Free trials are available for new customers. If you cancel 
                  during the trial period, you will not be charged. If you do not cancel, your subscription 
                  will automatically begin at the end of the trial period.
                </p>
              </section>

              {/* Cancellation */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Cancellation and Refunds</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You may cancel your subscription at any time through your account settings. Cancellation 
                  takes effect at the end of your current billing period. You will continue to have access 
                  to the Service until the end of the period you've already paid for.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We do not provide refunds for partial billing periods. If you cancel mid-cycle, you will 
                  retain access until the end of your paid period.
                </p>
              </section>

              {/* User Responsibilities */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">7. User Responsibilities</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You agree to use the Service only for lawful purposes and in accordance with these Terms. 
                  You agree not to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Use the Service for any illegal or unauthorized purpose</li>
                  <li>Violate any laws in your jurisdiction</li>
                  <li>Transmit any viruses, malware, or harmful code</li>
                  <li>Attempt to gain unauthorized access to the Service</li>
                  <li>Use the Service to make unsolicited calls in violation of applicable laws (including TCPA, CAN-SPAM)</li>
                  <li>Impersonate any person or entity</li>
                  <li>Interfere with or disrupt the Service</li>
                </ul>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEVERMISS AI SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, 
                  WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER 
                  INTANGIBLE LOSSES.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our total liability for any claims arising from or related to the Service shall not exceed 
                  the amount you paid us in the twelve (12) months preceding the claim.
                </p>
              </section>

              {/* Disclaimer */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
                <p className="text-muted-foreground leading-relaxed">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
                  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, 
                  FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. We do not warrant that the Service 
                  will be uninterrupted, secure, or error-free.
                </p>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify you of any material 
                  changes by email or through a notice on our website. Your continued use of the Service after 
                  such modifications constitutes your acceptance of the updated Terms.
                </p>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We may terminate or suspend your account and access to the Service immediately, without prior 
                  notice, for any breach of these Terms or for any other reason we deem necessary.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Upon termination, your right to use the Service will cease immediately. All provisions of 
                  these Terms that by their nature should survive termination shall survive.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about these Terms, please contact us at:
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>Email:</strong> support@nevermiss.ai<br />
                  <strong>Website:</strong> <Link href="/" className="text-teal-600 hover:underline">nevermiss.ai</Link>
                </p>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of the United States, 
                  without regard to its conflict of law provisions. Any disputes arising from these Terms or the 
                  Service shall be resolved in the courts of competent jurisdiction.
                </p>
              </section>
            </CardContent>
          </Card>

          {/* Footer CTA */}
          <div className="mt-8 text-center">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600">
                Get Started with NeverMiss AI
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

