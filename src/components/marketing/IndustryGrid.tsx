'use client'

import Link from 'next/link'
import { getAllIndustries } from '@/lib/industries/config'
import { ArrowRight } from 'lucide-react'

export function IndustryGrid() {
  const industries = getAllIndustries()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
      {industries.map((industry) => {
        const IconComponent = industry.iconComponent
        return (
          <Link
            key={industry.slug}
            href={`/industries/${industry.slug}`}
            className="group relative"
          >
            <div className={`
              flex flex-col items-center p-6 md:p-8 rounded-2xl border-2 border-gray-100
              bg-white hover:border-teal-300 hover:shadow-xl hover:shadow-teal-500/10
              transition-all duration-300 hover:-translate-y-1
            `}>
              <div className={`
                p-4 rounded-2xl ${industry.bgColor} mb-4
                group-hover:scale-110 transition-transform duration-300
              `}>
                <IconComponent className={`h-8 w-8 ${industry.color}`} />
              </div>
              <h3 className="font-semibold text-gray-900 text-center mb-1">
                {industry.name}
              </h3>
              <p className="text-xs text-gray-500 text-center hidden md:block">
                {industry.tagline}
              </p>
              <div className="mt-3 flex items-center gap-1 text-sm text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

