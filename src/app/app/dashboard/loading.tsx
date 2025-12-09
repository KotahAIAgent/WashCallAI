import { MetricCardSkeleton, CardSkeleton } from "@/components/loading/CardSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Charts and Activity Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-7">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
      </div>
    </div>
  )
}

