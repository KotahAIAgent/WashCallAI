'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// TEST MODE: Set to false for production
const TEST_MODE = false

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: 'easeIn',
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

export function PageLoader() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Remove initial loader if it exists
    if (typeof document !== 'undefined') {
      const initialLoader = document.getElementById('initial-loader')
      if (initialLoader) {
        initialLoader.remove()
      }
      document.body.style.overflow = 'hidden'
    }

    if (TEST_MODE) {
      // TEST MODE: Show for 3 seconds then hide
      const testTimer = setTimeout(() => {
        setIsLoading(false)
        if (typeof document !== 'undefined') {
          document.body.style.overflow = ''
        }
      }, 3000)
      return () => clearTimeout(testTimer)
    } else {
      // PRODUCTION MODE: Normal behavior
      // Minimum display time to ensure it's visible (1.5 seconds)
      const minTimer = setTimeout(() => {
        // Then check if page is loaded
        const handleLoad = () => {
          setTimeout(() => {
            setIsLoading(false)
            if (typeof document !== 'undefined') {
              document.body.style.overflow = ''
            }
          }, 300)
        }

        if (typeof window !== 'undefined') {
          if (document.readyState === 'complete') {
            handleLoad()
          } else {
            window.addEventListener('load', handleLoad)
            return () => {
              window.removeEventListener('load', handleLoad)
            }
          }
        }
      }, 1500) // Show for at least 1.5 seconds

      return () => {
        clearTimeout(minTimer)
        if (typeof document !== 'undefined') {
          document.body.style.overflow = ''
        }
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-white dark:bg-gray-900"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999
          }}
        >
          {/* Background gradient blobs */}
          <div className="pointer-events-none absolute -top-40 -right-32 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

          <motion.div
            variants={item}
            className="relative flex flex-col items-center gap-4"
          >
            {/* Company Name */}
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              NeverMiss AI
            </h1>
            {TEST_MODE && (
              <motion.p
                variants={item}
                className="text-sm text-gray-500 mt-2"
              >
                Test Mode - Will show for 3 seconds
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

