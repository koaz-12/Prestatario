'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    User,
    LogOut,
    Settings,
    Loader2,
} from 'lucide-react'
import { signOut } from '@/app/auth/actions'

export function TopHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    function handleSignOut() {
        startTransition(async () => {
            await signOut()
        })
    }

    return (
        <div className="flex items-center justify-between px-4 pt-6 pb-2">
            <div>
                <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
                {subtitle && <p className="text-zinc-500 text-sm mt-0.5">{subtitle}</p>}
            </div>

            {/* Profile avatar button */}
            <div className="relative">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/15 hover:scale-105 active:scale-95 transition-transform"
                >
                    <User className="w-5 h-5 text-white" />
                </button>

                {/* Dropdown menu */}
                {menuOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setMenuOpen(false)}
                        />
                        {/* Menu */}
                        <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                            <button
                                onClick={() => { setMenuOpen(false); router.push('/profile') }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                            >
                                <Settings className="w-4 h-4 text-zinc-500" />
                                Mi Perfil
                            </button>
                            <div className="border-t border-zinc-800" />
                            <button
                                onClick={handleSignOut}
                                disabled={isPending}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <LogOut className="w-4 h-4" />
                                )}
                                Cerrar Sesión
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
