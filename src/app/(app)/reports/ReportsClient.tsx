'use client'

import { Card } from '@/components/ui/card'
import { TopHeader } from '@/components/navigation/TopHeader'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Download
} from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ReportData {
    monthlyData: {
        month: string
        lent: number
        collected: number
    }[]
    summary: {
        totalLent: number
        totalCollected: number
        balance: number
    }
}

interface ReportsClientProps {
    data: ReportData
    currency: string
}

export function ReportsClient({ data, currency }: ReportsClientProps) {
    const { monthlyData, summary } = data

    const maxAmount = Math.max(...monthlyData.map(d => Math.max(d.lent, d.collected)), 1)

    return (
        <div className="pb-24">
            <TopHeader title="Reportes" subtitle="Análisis de tu actividad" />

            <div className="px-4 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4">
                    <Card className="p-6 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Wallet className="w-16 h-16 text-emerald-400" />
                        </div>
                        <p className="text-zinc-500 text-sm font-medium mb-1">Caja Total (Prestado)</p>
                        <h3 className="text-3xl font-bold text-zinc-100">{formatMoney(summary.totalLent, currency)}</h3>
                        <div className="flex items-center gap-2 mt-4 text-xs">
                            <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">Todo el tiempo</span>
                        </div>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                                <TrendingDown className="w-4 h-4 text-blue-400" />
                            </div>
                            <p className="text-zinc-500 text-xs mb-1">Recuperado</p>
                            <p className="text-lg font-bold text-blue-400">{formatMoney(summary.totalCollected, currency)}</p>
                        </Card>

                        <Card className="p-4 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                                <DollarSign className="w-4 h-4 text-amber-400" />
                            </div>
                            <p className="text-zinc-500 text-xs mb-1">En la calle</p>
                            <p className="text-lg font-bold text-amber-400">{formatMoney(summary.balance, currency)}</p>
                        </Card>
                    </div>
                </div>

                {/* Monthly Chart */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-zinc-500" />
                            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Flujo Mensual</h2>
                        </div>
                        <a href="/api/export/loans" download>
                            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 text-xs">
                                <Download className="w-3 h-3 mr-1" /> Excel
                            </Button>
                        </a>
                    </div>

                    <Card className="p-6 border-zinc-800 bg-zinc-900/40 backdrop-blur-sm space-y-8">
                        {monthlyData.map((d, i) => (
                            <div key={d.month} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-400 uppercase">{d.month}</span>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            <span className="text-[10px] text-zinc-500">Préstamos</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] text-zinc-500">Cobros</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {/* Lent bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-zinc-600">Prestado</span>
                                            <span className="text-zinc-300 font-medium">{formatMoney(d.lent, currency)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-red-500/60 transition-all duration-1000 ease-out"
                                                style={{ width: `${(d.lent / maxAmount) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Collected bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-zinc-600">Recuperado</span>
                                            <span className="text-emerald-400 font-medium">{formatMoney(d.collected, currency)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                                                style={{ width: `${(d.collected / maxAmount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Card>
                </div>

                {/* Tips Card */}
                <Card className="p-4 border-zinc-800 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border-dashed">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            <span className="text-emerald-400 font-bold italic">Tip:</span>
                            Mantén tu margen de cobro por encima del 70% de lo prestado mensualmente para asegurar una caja saludable.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
