'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/navigation/BottomNav'
import { NewLoanSheet } from '@/components/loans/NewLoanSheet'
import { DraggableFAB } from '@/components/loans/DraggableFAB'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [loanSheetOpen, setLoanSheetOpen] = useState(false)

    return (
        <div className="min-h-screen bg-zinc-950 pb-20">
            {children}
            <DraggableFAB onTap={() => setLoanSheetOpen(true)} />
            <BottomNav />
            <NewLoanSheet open={loanSheetOpen} onOpenChange={setLoanSheetOpen} />
        </div>
    )
}
