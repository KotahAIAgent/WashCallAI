import { Navbar } from '@/components/marketing/Navbar'
import { Footer } from '@/components/marketing/Footer'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Ambient background effects */}
      <div className="fixed inset-0 bg-mesh pointer-events-none z-0" />
      <div className="fixed inset-0 bg-grid opacity-[0.02] pointer-events-none z-0" />
      
      <Navbar />
      <main className="flex-1 pt-16 relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  )
}
