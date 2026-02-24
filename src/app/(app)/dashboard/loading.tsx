import { TopHeader } from '@/components/navigation/TopHeader'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
    return (
        <div>
            <TopHeader title="Dashboard" subtitle="Resumen de tu negocio" />

            <div className="px-4 space-y-6">
                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                </div>

                <Skeleton className="h-28 w-full rounded-xl" />

                {/* Loans List Skeleton */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-12" />
                    </div>

                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
