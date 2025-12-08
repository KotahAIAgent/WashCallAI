'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">FusionCaller</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#features" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              Industries
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              Login
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>

          <div className="md:hidden">
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

