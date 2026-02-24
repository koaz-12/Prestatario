'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoanCard } from '@/components/loans/LoanCard'
import { TopHeader } from '@/components/navigation/TopHeader'
import {
    DollarSign,
    AlertTriangle,
    TrendingUp,
    Search,
    Users,
    HandCoins,
} from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import { cacheLoans, getCachedLoans } from '@/lib/offline/db'
import { useOnlineStatus } from '@/lib/offline/useOnlineStatus'
import type { DashboardStats, Loan, Contact } from '@/lib/types'

interface DashboardClientProps {
    stats: DashboardStats
    loans: Loan[]
    currency: string
}

export function DashboardClient({ stats, loans: serverLoans, currency }: DashboardClientProps) {
    const [search, setSearch] = useState('')
    const [loans, setLoans] = useState<(Loan & { contact?: Contact | null })[]>(serverLoans)
    const isOnline = useOnlineStatus()

    useEffect(() => {
        if (serverLoans.length > 0) {
            // Cache fresh data
            cacheLoans(serverLoans)
            setLoans(serverLoans)
        } else if (!isOnline) {
            // Load from cache
            getCachedLoans().then(cached => {
                if (cached.length > 0) setLoans(cached)
            })
        }
    }, [serverLoans, isOnline])

    const filteredLoans = loans.filter(loan =>
        loan.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
        (loan.description && loan.description.toLowerCase().includes(search.toLowerCase()))
    )

    // Group debts by person
    const debtByPerson = useMemo(() => {
        const grouped: Record<string, { name: string; total: number; count: number }> = {}
        loans.forEach(loan => {
            const key = loan.borrower_name.toLowerCase()
            if (!grouped[key]) {
                grouped[key] = { name: loan.borrower_name, total: 0, count: 0 }
            }
            grouped[key].total += Number(loan.amount)
            grouped[key].count += 1
        })
        return Object.values(grouped).sort((a, b) => b.total - a.total)
    }, [loans])

    return (
        <div>
            <TopHeader title="Dashboard" subtitle="Resumen de tus préstamos" />
            <div className="px-4 space-y-6">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="p-4 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-emerald-400">
                            {formatMoney(stats.totalAmountOut, currency)}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">Total prestado</p>
                    </Card>

                    <Card className="p-4 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-amber-400" />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-zinc-100">{stats.totalActive}</p>
                        <p className="text-xs text-zinc-500 mt-1">Préstamos activos</p>
                    </Card>

                    <Card className="p-4 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-red-400">{stats.overdueCount}</p>
                        <p className="text-xs text-zinc-500 mt-1">Vencidos</p>
                    </Card>

                    <Card className="p-4 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <HandCoins className="w-4 h-4 text-blue-400" />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-zinc-100">{stats.totalLoans}</p>
                        <p className="text-xs text-zinc-500 mt-1">Total histórico</p>
                    </Card>
                </div>

                {/* Per-person summary */}
                {debtByPerson.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-zinc-500" />
                            <h2 className="text-sm font-semibold text-zinc-400">Deuda por persona</h2>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                            {debtByPerson.map((person) => (
                                <Card
                                    key={person.name}
                                    className="shrink-0 p-3 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm min-w-[140px]"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-zinc-400">
                                                {person.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium text-zinc-200 truncate">{person.name}</span>
                                    </div>
                                    <p className="text-lg font-bold text-emerald-400">
                                        <span className="text-emerald-400 font-bold">{formatMoney(person.total, currency)}</span>
                                        <span className="text-xs text-zinc-500 font-normal ml-2">({person.count} prés.)</span>
                                    </p>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o descripción..."
                        className="pl-10 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                    />
                </div>

                {/* Active Loans */}
                <div>
                    <h2 className="text-lg font-semibold text-zinc-200 mb-3">
                        Préstamos Activos
                        {filteredLoans.length > 0 && (
                            <span className="text-sm font-normal text-zinc-500 ml-2">({filteredLoans.length})</span>
                        )}
                    </h2>
                    {filteredLoans.length === 0 ? (
                        <Card className="p-8 border-zinc-800 bg-zinc-900/40 text-center">
                            <HandCoins className="w-12 h-12 mx-auto text-zinc-700 mb-3" />
                            <p className="text-zinc-500">
                                {search ? 'No se encontraron préstamos' : 'No tienes préstamos activos'}
                            </p>
                            <p className="text-zinc-600 text-sm mt-1">
                                {!search && 'Toca el botón + para crear uno nuevo'}
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredLoans.map((loan) => (
                                <LoanCard key={loan.id} loan={loan} currency={currency} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
