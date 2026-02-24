'use client'

import { useState, useEffect, useTransition } from 'react'
import { Search, X, HandCoins, Users, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatMoney } from '@/lib/utils'

interface SearchResult {
    type: 'loan' | 'contact'
    id: string
    title: string
    subtitle: string
    href: string
    amount?: number
    currency?: string
}

interface GlobalSearchProps {
    open: boolean
    onClose: () => void
    currency: string
}

export function GlobalSearch({ open, onClose, currency }: GlobalSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (!open) { setQuery(''); setResults([]) }
    }, [open])

    useEffect(() => {
        if (query.length < 2) { setResults([]); return }

        const timeout = setTimeout(() => {
            startTransition(async () => {
                const { searchAll } = await import('@/app/actions/search')
                const data = await searchAll(query)
                setResults(data)
            })
        }, 300)

        return () => clearTimeout(timeout)
    }, [query])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[200] flex flex-col">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 mx-4 mt-16 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
                    <Search className="w-5 h-5 text-zinc-500 shrink-0" />
                    <Input
                        autoFocus
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Buscar préstamos, clientes..."
                        className="flex-1 border-0 bg-transparent text-zinc-100 placeholder:text-zinc-600 text-base focus-visible:ring-0 p-0"
                    />
                    {isPending && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin shrink-0" />}
                    <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Results */}
                {results.length > 0 && (
                    <ul className="divide-y divide-zinc-800/60 max-h-72 overflow-y-auto">
                        {results.map(r => (
                            <li key={`${r.type}-${r.id}`}>
                                <Link
                                    href={r.href}
                                    onClick={onClose}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/60 transition-colors"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${r.type === 'loan' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
                                        {r.type === 'loan'
                                            ? <HandCoins className="w-4 h-4 text-emerald-400" />
                                            : <Users className="w-4 h-4 text-blue-400" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-zinc-100 truncate">{r.title}</p>
                                        <p className="text-xs text-zinc-500 truncate">{r.subtitle}</p>
                                    </div>
                                    {r.amount != null && (
                                        <span className="text-sm font-bold text-emerald-400 shrink-0">
                                            {formatMoney(r.amount, currency)}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                {query.length >= 2 && results.length === 0 && !isPending && (
                    <div className="p-8 text-center">
                        <p className="text-zinc-500 text-sm">No se encontraron resultados para «{query}»</p>
                    </div>
                )}

                {query.length < 2 && (
                    <div className="p-6 text-center">
                        <p className="text-zinc-600 text-xs">Escribe al menos 2 caracteres para buscar</p>
                    </div>
                )}
            </div>
        </div>
    )
}
