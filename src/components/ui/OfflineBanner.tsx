'use client'

import { useOnlineStatus } from '@/lib/offline/useOnlineStatus'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
    const isOnline = useOnlineStatus()

    if (isOnline) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 text-xs font-bold px-4 py-2 flex items-center justify-center gap-2 shadow-lg print:hidden">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>Sin conexión — Mostrando datos guardados</span>
        </div>
    )
}
