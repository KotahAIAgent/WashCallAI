import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Shield } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | NeverMiss AI',
  description: 'Privacy Policy for NeverMiss AI',
}

export default function PrivacyPage() {
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
              <Shield className="h-8 w-8 text-teal-600" />
              <h1 className="text-4xl font-bold">Privacy Policy</h1>
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
                  NeverMiss AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your information when you use our AI-powered 
                  call answering and outbound calling services ("Service"). Please read this Privacy Policy carefully. 
                  By using our Service, you agree to the collection and use of information in accordance with this policy.
                </p>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Information You Provide</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Account information (name, email address, phone number, business name)</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Business information (services offered, service areas, pricing)</li>
                  <li>Contact lists and customer data you upload</li>
                  <li>Communications with our support team</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Information Automatically Collected</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  When you use our Service, we automatically collect certain information, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Call recordings and transcripts</li>
                  <li>Call metadata (duration, timestamps, phone numbers)</li>
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage data (features used, pages visited, time spent)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Information from Third Parties</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may receive information from third-party services you connect to our platform, such as CRM 
                  systems, calendar applications, or other integrations.
                </p>
              </section>

              {/* How We Use Information */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Provide, maintain, and improve our Service</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, and support messages</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Monitor and analyze usage patterns and trends</li>
                  <li>Detect, prevent, and address technical issues and fraud</li>
                  <li>Personalize your experience and provide customized content</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              {/* Data Sharing */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We do not sell your personal information. We may share your information in the following circumstances:
                </p>
                
                <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Service Providers</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We share information with third-party service providers who perform services on our behalf, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Payment processors (Stripe)</li>
                  <li>Cloud hosting providers (Supabase, Vercel)</li>
                  <li>AI voice service providers (Vapi.ai)</li>
                  <li>Email service providers</li>
                  <li>Analytics providers</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Legal Requirements</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may disclose your information if required by law or in response to valid requests by public 
                  authorities (e.g., court orders, subpoenas).
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Business Transfers</h3>
                <p className="text-muted-foreground leading-relaxed">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred 
                  as part of that transaction.
                </p>
              </section>

              {/* Data Security */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We implement appropriate technical and organizational security measures to protect your information 
                  against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication</li>
                  <li>Secure data centers and infrastructure</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  However, no method of transmission over the Internet or electronic storage is 100% secure. While 
                  we strive to protect your information, we cannot guarantee absolute security.
                </p>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Your Rights and Choices</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Depending on your location, you may have certain rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Access:</strong> Request access to your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Objection:</strong> Object to certain processing activities</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  To exercise these rights, please contact us at support@nevermiss.ai. We will respond to your 
                  request within 30 days.
                </p>
              </section>

              {/* Cookies */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking Technologies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use cookies and similar tracking technologies to track activity on our Service and store 
                  certain information. Cookies are small data files stored on your device. You can instruct your 
                  browser to refuse all cookies or to indicate when a cookie is being sent.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We use cookies for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Authentication and session management</li>
                  <li>Remembering your preferences</li>
                  <li>Analyzing usage patterns</li>
                  <li>Improving our Service</li>
                </ul>
              </section>

              {/* Third-Party Services */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our Service may contain links to third-party websites or integrate with third-party services. 
                  We are not responsible for the privacy practices of these third parties. We encourage you to 
                  read their privacy policies.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  When you connect third-party services (e.g., CRM systems, calendars), we may access and store 
                  information from those services as necessary to provide our Service.
                </p>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our Service is not intended for individuals under the age of 18. We do not knowingly collect 
                  personal information from children. If you believe we have collected information from a child, 
                  please contact us immediately and we will delete such information.
                </p>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We retain your personal information for as long as necessary to provide our Service and fulfill 
                  the purposes outlined in this Privacy Policy, unless a longer retention period is required or 
                  permitted by law. When you delete your account, we will delete or anonymize your personal 
                  information, except where we are required to retain it for legal purposes.
                </p>
              </section>

              {/* International Transfers */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your information may be transferred to and processed in countries other than your country of 
                  residence. These countries may have data protection laws that differ from those in your country. 
                  By using our Service, you consent to the transfer of your information to these countries.
                </p>
              </section>

              {/* Changes to Policy */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes 
                  by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage 
                  you to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <p className="text-muted-foreground">
                  <strong>Email:</strong> support@nevermiss.ai<br />
                  <strong>Website:</strong> <Link href="/" className="text-teal-600 hover:underline">nevermiss.ai</Link>
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

