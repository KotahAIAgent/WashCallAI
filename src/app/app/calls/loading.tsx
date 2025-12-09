import { TableSkeleton } from "@/components/loading/TableSkeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CallsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-56 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-4">
            <div className="h-10 w-[180px] bg-muted animate-pulse rounded" />
            <div className="h-10 w-[180px] bg-muted animate-pulse rounded" />
            <div className="h-10 w-[180px] bg-muted animate-pulse rounded" />
            <div className="h-10 w-[180px] bg-muted animate-pulse rounded" />
            <div className="h-10 w-20 bg-muted animate-pulse rounded" />
          </div>
          <TableSkeleton rows={5} columns={7} />
        </CardContent>
      </Card>
    </div>
  )
}

