import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative bg-card/50 border-t border-border/30">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-950/10 to-transparent pointer-events-none" />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h3 className="text-xl font-black gradient-text">FusionCaller</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered receptionist for service businesses. Never miss another customer again.
            </p>
          </div>
          
          {/* Product */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#features" className="text-muted-foreground hover:text-purple-400 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-muted-foreground hover:text-purple-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/case-studies" className="text-muted-foreground hover:text-purple-400 transition-colors">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-muted-foreground hover:text-purple-400 transition-colors">
                  Compare
                </Link>
              </li>
              <li>
                <Link href="/affiliate" className="text-muted-foreground hover:text-purple-400 transition-colors">
                  Affiliate Program
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/api-docs" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  API Documentation
                </Link>
              </li>
              <li>
                <Link href="/trust" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  Trust Center
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-pink-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-pink-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FusionCaller. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground/50">Built with</span>
            <span className="text-xs text-purple-400">♥</span>
            <span className="text-xs text-muted-foreground/50">by FusionCaller Team</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
