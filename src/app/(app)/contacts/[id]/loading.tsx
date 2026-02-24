import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ContactDetailLoading() {
    return (
        <div className="min-h-[100dvh] bg-zinc-950 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-4 h-16 flex items-center gap-3">
                <Link href="/contacts" className="p-2 -ml-2 text-zinc-400 hover:text-zinc-100 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </header>

            <main className="px-4 py-6 space-y-6">
                {/* Balance Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-24 w-full rounded-2xl" />
                    <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
                <Skeleton className="h-28 w-full rounded-2xl" />

                {/* Timeline */}
                <div className="space-y-4">
                    <Skeleton className="h-6 w-40" />

                    <div className="relative pl-6 space-y-8 mt-6 border-l-2 border-zinc-800/50">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="relative">
                                {/* Dot */}
                                <div className="absolute -left-[31px] w-3 h-3 rounded-full bg-zinc-700" />
                                <Skeleton className="h-24 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
