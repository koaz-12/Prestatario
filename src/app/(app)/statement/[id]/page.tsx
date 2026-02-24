'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatMoney } from '@/lib/utils'
import { Printer, ChevronLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface StatementPageProps {
    params: { id: string }
}

export default function StatementPage({ params }: any) {
    const { id } = params
    const [data, setData] = useState<any>(null)
    const [currency, setCurrency] = useState('DOP')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            // We use the same action as the detail page
            const { getContactDetail } = await import('@/app/actions/contacts')
            const { getUserCurrency } = await import('@/app/actions/profile')

            const [detail, curr] = await Promise.all([
                getContactDetail(id),
                getUserCurrency()
            ])

            setData(detail)
            setCurrency(curr)
            setLoading(false)
        }
        fetchData()
    }, [id])

    if (loading) return <div className="p-8 text-center text-zinc-500 font-medium">Generando estado de cuenta...</div>

    if (!data) return <div className="p-8 text-center text-red-500 font-medium">No se encontró el cliente.</div>

    const { contact, payments, stats } = data

    return (
        <div className="min-h-screen bg-white text-black p-4 sm:p-8 font-sans">
            {/* Action Bar (hidden in print) */}
            <div className="flex items-center justify-between mb-8 print:hidden border-b border-zinc-100 pb-4">
                <Link href={`/contacts/${id}`}>
                    <Button variant="ghost" size="sm" className="text-zinc-600">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Volver
                    </Button>
                </Link>
                <Button
                    onClick={() => window.print()}
                    className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg transition-all"
                >
                    <Printer className="w-4 h-4 mr-2" /> Imprimir / PDF
                </Button>
            </div>

            {/* Statement Content */}
            <div className="max-w-3xl mx-auto border border-zinc-200 shadow-sm p-8 rounded-lg print:border-0 print:shadow-none print:p-0">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b-2 border-zinc-900 pb-6">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900">Estado de Cuenta</h1>
                        <p className="text-sm text-zinc-500 mt-1">Generado el {format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="font-bold text-lg">PRESTATARIO</h2>
                        <p className="text-xs text-zinc-500 font-mono italic">Sistema de Gestión de Préstamos</p>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div>
                        <h3 className="text-[10px] font-bold uppercase text-zinc-400 mb-2">Cliente</h3>
                        <p className="font-bold text-xl">{contact.name}</p>
                        {contact.phone && <p className="text-zinc-600 text-sm mt-1">{contact.phone}</p>}
                    </div>
                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                        <h3 className="text-[10px] font-bold uppercase text-zinc-400 mb-2 text-center">Resumen de Cuenta</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">Total Prestado:</span>
                                <span className="font-bold">{formatMoney(stats.totalBorrowed, currency)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">Total Pagado:</span>
                                <span className="font-bold text-emerald-600">{formatMoney(stats.totalPaid, currency)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-zinc-200">
                                <span className="text-sm font-bold uppercase text-zinc-900">Saldo Pendiente:</span>
                                <span className="text-sm font-black text-red-600">{formatMoney(stats.balance, currency)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payments Table */}
                <div>
                    <h3 className="text-sm font-black uppercase text-zinc-900 mb-4 border-l-4 border-zinc-900 pl-3">Detalle de Pagos Recibidos</h3>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-zinc-900 text-white">
                                <th className="py-3 px-4 text-left font-bold uppercase text-[10px]">Fecha</th>
                                <th className="py-3 px-4 text-left font-bold uppercase text-[10px]">Descripción / Notas</th>
                                <th className="py-3 px-4 text-right font-bold uppercase text-[10px]">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-8 text-center text-zinc-400 italic bg-zinc-50 border-b border-zinc-100">
                                        No se han registrado pagos aún.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((p: any, i: number) => (
                                    <tr key={p.id} className={i % 2 === 0 ? 'bg-white border-b border-zinc-100' : 'bg-zinc-50 border-b border-zinc-100'}>
                                        <td className="py-3 px-4 text-zinc-600 font-medium">
                                            {format(new Date(p.payment_date), 'dd/MM/yyyy')}
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-zinc-900 font-bold">Abono</p>
                                            {p.notes && <p className="text-zinc-500 text-[11px] italic mt-0.5">{p.notes}</p>}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="font-black text-zinc-900">{formatMoney(Number(p.amount), currency)}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-zinc-100 font-bold border-t-2 border-zinc-900">
                                <td colSpan={2} className="py-4 px-4 text-right uppercase text-[11px]">Total acumulado pagado</td>
                                <td className="py-4 px-4 text-right text-lg text-emerald-600">{formatMoney(stats.totalPaid, currency)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer */}
                <div className="mt-16 text-center text-[10px] text-zinc-400 pt-12 border-t border-zinc-100 italic">
                    <p>Este documento es un resumen informativo de su historial de préstamos y pagos.</p>
                    <p className="mt-1">Gracias por su cumplimiento.</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; }
                    body { background: white; color: black; }
                    .print-hidden { display: none !important; }
                    nav { display: none !important; }
                    footer { display: none !important; }
                }
            `}</style>
        </div>
    )
}
