'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoanCard } from '@/components/loans/LoanCard'
import { TopHeader } from '@/components/navigation/TopHeader'
import { Clock, Search } from 'lucide-react'
import type { Loan } from '@/lib/types'

interface HistoryClientProps {
    loans: Loan[]
    currency: string
}

export function HistoryClient({ loans, currency }: HistoryClientProps) {
    const [search, setSearch] = useState('')

    const filteredLoans = loans.filter(loan =>
        loan.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
        (loan.description && loan.description.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div>
            <TopHeader title="Historial" subtitle="Préstamos devueltos" />
            <div className="px-4 space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar en historial..."
                        className="pl-10 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                    />
                </div>

                {filteredLoans.length === 0 ? (
                    <Card className="p-8 border-zinc-800 bg-zinc-900/40 text-center">
                        <Clock className="w-12 h-12 mx-auto text-zinc-700 mb-3" />
                        <p className="text-zinc-500">
                            {search ? 'No se encontraron resultados' : 'No hay préstamos devueltos aún'}
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
    )
}
