import { TopHeader } from '@/components/navigation/TopHeader'
import { Skeleton } from '@/components/ui/skeleton'

export default function ContactsLoading() {
    return (
        <div>
            <TopHeader title="Clientes" subtitle="Personas a las que prestas" />
            <div className="px-4 space-y-4">
                {/* Search / Add Skeleton */}
                <div className="flex gap-2">
                    <Skeleton className="h-11 flex-1 rounded-xl" />
                    <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                </div>

                {/* Contacts List Skeleton */}
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    )
}
