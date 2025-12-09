import { CardSkeleton } from "@/components/loading/CardSkeleton"
import { TableSkeleton } from "@/components/loading/TableSkeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function LeadsLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="h-6 w-40 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-56 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="h-10 w-full sm:w-[200px] bg-muted animate-pulse rounded" />
              <div className="h-10 w-full sm:w-auto bg-muted animate-pulse rounded" />
            </div>
          </div>
          
          {/* Mobile view skeleton */}
          <div className="block md:hidden space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-2">
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>

          {/* Desktop table skeleton */}
          <div className="hidden md:block">
            <TableSkeleton rows={5} columns={7} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

