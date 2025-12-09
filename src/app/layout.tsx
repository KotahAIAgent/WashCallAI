import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FusionCaller - Never Miss Another Customer Again',
  description: '24/7 AI receptionist and outbound calling for service businesses. HVAC, Dental, Plumbing, Landscaping & more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  )
}

