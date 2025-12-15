import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Database, CheckCircle2, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Trust Center | FusionCaller',
  description: 'Security, privacy, and compliance information',
}

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Security & Compliance</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Trust Center
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your data security and privacy are our top priorities
            </p>
          </div>

          <div className="space-y-8">
            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Data Encryption
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      All data in transit is encrypted using TLS 1.3. Data at rest is encrypted using AES-256.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Authentication
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Multi-factor authentication (MFA) supported. API keys are securely stored and can be rotated.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Infrastructure
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Hosted on AWS with SOC 2 Type II compliance. Regular security audits and penetration testing.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Access Controls
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Role-based access control (RBAC) with organization-level data isolation. Row-level security policies.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Data Ownership</h3>
                  <p className="text-sm text-muted-foreground">
                    You own all your data. We never sell your data to third parties. You can export or delete your data at any time.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Data Retention</h3>
                  <p className="text-sm text-muted-foreground">
                    Call recordings and transcripts are retained according to your subscription plan. You can configure retention policies.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">GDPR Compliance</h3>
                  <p className="text-sm text-muted-foreground">
                    We comply with GDPR requirements. You can request data access, correction, or deletion at any time.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">CCPA Compliance</h3>
                  <p className="text-sm text-muted-foreground">
                    California Consumer Privacy Act (CCPA) compliant. California residents have additional privacy rights.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Compliance & Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Badge variant="outline">SOC 2 Type II</Badge>
                    <span className="text-sm text-muted-foreground">In Progress</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Badge variant="outline">GDPR</Badge>
                    <span className="text-sm text-muted-foreground">Compliant</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Badge variant="outline">CCPA</Badge>
                    <span className="text-sm text-muted-foreground">Compliant</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Badge variant="outline">HIPAA</Badge>
                    <span className="text-sm text-muted-foreground">Available on Enterprise</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Storage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Storage & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Primary Region</h3>
                  <p className="text-sm text-muted-foreground">
                    Data is primarily stored in US East (N. Virginia) AWS region. EU data residency available on Enterprise plans.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Backups</h3>
                  <p className="text-sm text-muted-foreground">
                    Daily automated backups with point-in-time recovery. Backups are encrypted and stored in geographically distributed locations.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Disaster Recovery</h3>
                  <p className="text-sm text-muted-foreground">
                    Recovery Time Objective (RTO): &lt; 4 hours. Recovery Point Objective (RPO): &lt; 1 hour.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Incident Response */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Incident Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  In the event of a security incident, we follow a structured incident response process:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Detection and analysis</li>
                  <li>Containment and mitigation</li>
                  <li>Notification to affected customers (within 72 hours)</li>
                  <li>Post-incident review and improvements</li>
                </ol>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Security Questions?</h2>
                <p className="text-muted-foreground mb-6">
                  Contact our security team at <a href="mailto:security@fusioncaller.com" className="text-primary hover:underline">security@fusioncaller.com</a>
                </p>
                <a href="/privacy">
                  <button className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition">
                    View Privacy Policy
                  </button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

