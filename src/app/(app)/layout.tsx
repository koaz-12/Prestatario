'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/navigation/BottomNav'
import { NewLoanSheet } from '@/components/loans/NewLoanSheet'
import { DraggableFAB } from '@/components/loans/DraggableFAB'
import { OfflineBanner } from '@/components/ui/OfflineBanner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [loanSheetOpen, setLoanSheetOpen] = useState(false)

    return (
        <div className="min-h-screen bg-zinc-950 pb-20">
            <OfflineBanner />
            {children}
            <div className="print:hidden">
                <DraggableFAB onTap={() => setLoanSheetOpen(true)} />
                <BottomNav />
                <NewLoanSheet open={loanSheetOpen} onOpenChange={setLoanSheetOpen} />
            </div>
        </div>
    )
}
