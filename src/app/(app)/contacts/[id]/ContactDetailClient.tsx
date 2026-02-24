'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    ChevronLeft,
    User,
    Phone,
    StickyNote,
    TrendingDown,
    DollarSign,
    HandCoins,
    History,
    Calendar,
    ArrowUpRight,
    FileText
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoanCard } from '@/components/loans/LoanCard'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatMoney } from '@/lib/utils'
import type { Contact, Loan, LoanPayment } from '@/lib/types'

interface ContactDetailClientProps {
    detail: {
        contact: Contact
        loans: Loan[]
        payments: any[]
        stats: {
            totalBorrowed: number
            totalPaid: number
            balance: number
            activeLoans: number
        }
    }
    currency: string
}

export function ContactDetailClient({ detail, currency }: ContactDetailClientProps) {
    const { contact, loans, payments, stats } = detail
    const [activeTab, setActiveTab] = useState<'loans' | 'history'>('loans')

    const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue')
    const finishedLoans = loans.filter(l => l.status === 'returned')

    return (
        <div className="pb-24">
            {/* Header / Profile Info */}
            <div className="bg-zinc-950 border-b border-zinc-800/60 pb-6 pt-2">
                <div className="px-4 mb-4">
                    <Link href="/contacts" className="inline-flex items-center text-zinc-500 hover:text-zinc-300 transition-colors">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        <span className="text-sm font-medium">Clientes</span>
                    </Link>
                </div>

                <div className="px-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                        <span className="text-2xl font-bold">{contact.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-zinc-100 truncate">{contact.name}</h1>
                        <div className="flex flex-wrap gap-3 mt-1">
                            {contact.phone && (
                                <div className="flex items-center gap-1 text-zinc-400 text-xs">
                                    <Phone className="w-3 h-3" />
                                    <span>{contact.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1 text-zinc-400 text-xs">
                                <HandCoins className="w-3 h-3" />
                                <span>{loans.length} préstamos totales</span>
                            </div>
                        </div>
                    </div>
                    <Link href={`/statement/${contact.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="hidden sm:flex border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-all">
                            <FileText className="w-4 h-4 mr-2" />
                            Estado de Cuenta
                        </Button>
                        <Button variant="outline" size="icon" className="flex sm:hidden border-zinc-700 text-zinc-400 h-10 w-10">
                            <FileText className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="px-4 mt-6 space-y-6">
                {/* Financial Summary Tiles */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="p-4 bg-zinc-900/40 border-zinc-800">
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <TrendingDown className="w-3 h-3 text-red-400" />
                            <span>Total Prestado</span>
                        </div>
                        <p className="text-xl font-bold text-zinc-100">{formatMoney(stats.totalBorrowed, currency)}</p>
                    </Card>
                    <Card className="p-4 bg-zinc-900/40 border-zinc-800">
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <HandCoins className="w-3 h-3 text-emerald-400" />
                            <span>Total Pagado</span>
                        </div>
                        <p className="text-xl font-bold text-zinc-100">{formatMoney(stats.totalPaid, currency)}</p>
                    </Card>
                </div>

                <Card className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border-emerald-500/20 shadow-xl shadow-emerald-500/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Saldo Pendiente Actual</span>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                            {stats.activeLoans} activos
                        </Badge>
                    </div>
                    <p className="text-3xl font-black text-emerald-400">
                        {formatMoney(stats.balance, currency)}
                    </p>
                </Card>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <button
                        onClick={() => setActiveTab('loans')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'loans' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}
                    >
                        Préstamos
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}
                    >
                        Cronología
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'loans' ? (
                    <div className="space-y-4">
                        {activeLoans.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">En curso</h3>
                                {activeLoans.map(loan => (
                                    <LoanCard key={loan.id} loan={loan} currency={currency} />
                                ))}
                            </div>
                        )}

                        {finishedLoans.length > 0 && (
                            <div className="space-y-3 pt-4">
                                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest px-1">Historial Pagado</h3>
                                {finishedLoans.map(loan => (
                                    <LoanCard key={loan.id} loan={loan} currency={currency} />
                                ))}
                            </div>
                        )}

                        {loans.length === 0 && (
                            <div className="py-12 text-center">
                                <p className="text-zinc-500 text-sm">Este cliente no tiene préstamos registrados.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1 mb-2">Todos los Abonos</h3>
                        {payments.length === 0 ? (
                            <div className="py-12 text-center bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
                                <History className="w-8 h-8 mx-auto text-zinc-800 mb-2" />
                                <p className="text-zinc-600 text-sm">No hay pagos registrados aún.</p>
                            </div>
                        ) : (
                            <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
                                {payments.map((p, i) => (
                                    <div key={p.id} className="relative pl-10">
                                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center z-10">
                                            <TrendingDown className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-zinc-100 truncate flex-1">
                                                    Abono de {formatMoney(Number(p.amount), currency)}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 font-mono">
                                                    {format(new Date(p.payment_date), 'dd/MM/yyyy')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1">
                                                <ArrowUpRight className="w-3 h-3" />
                                                <span>Aplicado a préstamo del {format(new Date(p.created_at), 'dd MMM')}</span>
                                            </div>
                                            {p.notes && (
                                                <div className="mt-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/50 italic text-[11px] text-zinc-400">
                                                    "{p.notes}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
