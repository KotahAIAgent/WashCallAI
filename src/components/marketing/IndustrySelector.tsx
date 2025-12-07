'use client'

import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAllIndustries } from '@/lib/industries/config'
import { Building2 } from 'lucide-react'

export function IndustrySelector() {
  const router = useRouter()
  const industries = getAllIndustries()

  const handleSelect = (slug: string) => {
    router.push(`/industries/${slug}`)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Select onValueChange={handleSelect}>
        <SelectTrigger className="h-14 text-lg px-6 bg-white border-2 border-gray-200 hover:border-teal-400 transition-colors shadow-lg">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-gray-400" />
            <SelectValue placeholder="I run a..." />
          </div>
        </SelectTrigger>
        <SelectContent className="text-lg">
          {industries.map((industry) => {
            const IconComponent = industry.iconComponent
            return (
              <SelectItem 
                key={industry.slug} 
                value={industry.slug}
                className="py-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${industry.bgColor}`}>
                    <IconComponent className={`h-4 w-4 ${industry.color}`} />
                  </div>
                  <span>{industry.name} Company</span>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}

