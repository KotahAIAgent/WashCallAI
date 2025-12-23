'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 rounded-lg blur-lg opacity-50 group-hover:opacity-80 transition-opacity"></div>
              <span className="relative text-2xl font-black gradient-text">FusionCaller</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/#features" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-purple-500/10 rounded-lg transition-all duration-200"
            >
              Features
            </Link>
            <Link 
              href="/#pricing" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-purple-500/10 rounded-lg transition-all duration-200"
            >
              Pricing
            </Link>
            <Link 
              href="/case-studies" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-purple-500/10 rounded-lg transition-all duration-200"
            >
              Case Studies
            </Link>
            <Link 
              href="/compare" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-purple-500/10 rounded-lg transition-all duration-200"
            >
              Compare
            </Link>
            <Link 
              href="/affiliate" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-purple-500/10 rounded-lg transition-all duration-200"
            >
              Affiliate
            </Link>
            
            <div className="w-px h-6 bg-border/50 mx-2" />
            
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-purple-500/10 rounded-lg transition-all duration-200"
            >
              Login
            </Link>
            <Link href="/signup">
              <Button className="ml-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 shadow-lg shadow-purple-500/25 font-semibold">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <Link href="/signup">
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg shadow-purple-500/25">
                Get Started
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-purple-500/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/30">
            <div className="flex flex-col space-y-1">
              <Link 
                href="/#features" 
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-purple-500/10 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="/#pricing" 
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-purple-500/10 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="/case-studies" 
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-purple-500/10 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Case Studies
              </Link>
              <Link 
                href="/compare" 
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-purple-500/10 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Compare
              </Link>
              <Link 
                href="/affiliate" 
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-purple-500/10 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Affiliate
              </Link>
              <div className="h-px bg-border/30 my-2" />
              <Link 
                href="/login" 
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-purple-500/10 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
