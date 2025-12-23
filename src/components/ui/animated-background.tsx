'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface FloatingOrbProps {
  className?: string
  color?: 'purple' | 'cyan' | 'pink' | 'blue'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  delay?: number
}

const colorMap = {
  purple: 'bg-purple-500/20',
  cyan: 'bg-cyan-500/20',
  pink: 'bg-pink-500/20',
  blue: 'bg-blue-500/20',
}

const sizeMap = {
  sm: 'w-32 h-32',
  md: 'w-64 h-64',
  lg: 'w-96 h-96',
  xl: 'w-[500px] h-[500px]',
}

export function FloatingOrb({ 
  className, 
  color = 'purple', 
  size = 'lg',
  delay = 0 
}: FloatingOrbProps) {
  return (
    <div
      className={cn(
        'absolute rounded-full blur-3xl animate-float pointer-events-none',
        colorMap[color],
        sizeMap[size],
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    />
  )
}

export function AnimatedGridBackground({ className }: { className?: string }) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />
      
      {/* Mesh gradient blobs */}
      <FloatingOrb color="purple" size="xl" className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <FloatingOrb color="cyan" size="lg" className="top-1/4 right-0 translate-x-1/3" delay={2} />
      <FloatingOrb color="pink" size="lg" className="bottom-0 left-1/4 translate-y-1/2" delay={4} />
      <FloatingOrb color="blue" size="md" className="top-1/2 left-1/2 -translate-x-1/2" delay={1} />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      {/* Noise texture */}
      <div className="absolute inset-0 bg-noise" />
    </div>
  )
}

export function CyberGrid({ className }: { className?: string }) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {/* Perspective grid */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'center top',
        }}
      />
      
      {/* Horizon glow */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-purple-900/20 to-transparent" />
    </div>
  )
}

export function ParticleField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    // Particles
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
    }> = []
    
    const colors = [
      'rgba(168, 85, 247, 0.5)',  // purple
      'rgba(6, 214, 160, 0.5)',   // cyan
      'rgba(236, 72, 153, 0.5)',  // pink
    ]
    
    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }
    
    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      
      particles.forEach(particle => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        
        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.offsetWidth
        if (particle.x > canvas.offsetWidth) particle.x = 0
        if (particle.y < 0) particle.y = canvas.offsetHeight
        if (particle.y > canvas.offsetHeight) particle.y = 0
        
        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()
      })
      
      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 100) {
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.2 * (1 - distance / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      
      animationId = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])
  
  return (
    <canvas 
      ref={canvasRef} 
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
    />
  )
}

export function GlowingBorder({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn('relative group', className)}>
      {/* Animated border */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
      <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500 animate-gradient-x bg-[length:200%_100%]" />
      
      {/* Content */}
      <div className="relative bg-card rounded-2xl">
        {children}
      </div>
    </div>
  )
}

export function SpotlightCard({ children, className }: { children: React.ReactNode, className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      container.style.setProperty('--mouse-x', `${x}%`)
      container.style.setProperty('--mouse-y', `${y}%`)
    }
    
    container.addEventListener('mousemove', handleMouseMove)
    return () => container.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-card border border-border/50',
        'before:absolute before:w-[300px] before:h-[300px] before:rounded-full',
        'before:bg-gradient-radial before:from-purple-500/20 before:to-transparent',
        'before:top-[var(--mouse-y,50%)] before:left-[var(--mouse-x,50%)]',
        'before:-translate-x-1/2 before:-translate-y-1/2',
        'before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
        'before:pointer-events-none',
        className
      )}
    >
      {children}
    </div>
  )
}

