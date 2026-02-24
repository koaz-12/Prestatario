'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    CheckCircle2,
    Trash2,
    Calendar,
    DollarSign,
    User,
    AlertTriangle,
    Loader2,
    ChevronDown,
    MessageCircle,
    Paperclip,
    Plus,
    History,
    X,
    HandCoins
} from 'lucide-react'
import { markAsReturned, deleteLoan } from '@/app/actions/loans'
import { getAttachments } from '@/app/actions/attachments'
import { addPayment, getPayments } from '@/app/actions/payments'
import { LoanAttachments } from '@/components/loans/LoanAttachments'
import { formatAmount, formatMoney } from '@/lib/utils'
import type { Loan, Contact, LoanAttachment, LoanPayment } from '@/lib/types'

interface LoanCardProps {
    loan: Loan & { contact?: Contact | null }
    showActions?: boolean
    currency?: string
}

export function LoanCard({ loan, showActions = true, currency = 'DOP' }: LoanCardProps) {
    const [isPending, startTransition] = useTransition()
    const [expanded, setExpanded] = useState(false)
    const [attachments, setAttachments] = useState<LoanAttachment[] | null>(null)
    const [payments, setPayments] = useState<LoanPayment[] | null>(null)
    const [loadingData, setLoadingData] = useState(false)

    // Payment form state
    const [showPaymentForm, setShowPaymentForm] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentNotes, setPaymentNotes] = useState('')

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPaymentAmount(formatAmount(e.target.value))
    }

    const [optimisticLoan, setOptimisticLoan] = useOptimistic(
        loan,
        (state, newAmount: number) => ({
            ...state,
            total_paid: Number(state.total_paid || 0) + newAmount,
            status: (Number(state.total_paid || 0) + newAmount) >= Number(state.amount) ? 'returned' : state.status
        })
    )

    const [optimisticPayments, setOptimisticPayments] = useOptimistic(
        payments || [],
        (state, newPayment: LoanPayment) => [newPayment, ...state]
    )

    const totalPaid = Number(optimisticLoan.total_paid || 0)
    const totalAmount = Number(optimisticLoan.amount)
    const remaining = totalAmount - totalPaid
    const progress = Math.min(100, (totalPaid / totalAmount) * 100)

    const isOverdue = optimisticLoan.due_date && new Date(optimisticLoan.due_date) < new Date() && optimisticLoan.status === 'active'
    const statusColor = optimisticLoan.status === 'returned'
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : isOverdue
            ? 'bg-red-500/10 text-red-400 border-red-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'

    const statusLabel = optimisticLoan.status === 'returned' ? 'Devuelto' : isOverdue ? 'Vencido' : 'Activo'

    async function handleExpand() {
        const next = !expanded
        setExpanded(next)
        if (next && (attachments === null || payments === null)) {
            setLoadingData(true)
            try {
                const [attData, payData] = await Promise.all([
                    getAttachments(loan.id),
                    getPayments(loan.id)
                ])
                setAttachments(attData)
                setPayments(payData)
            } finally {
                setLoadingData(false)
            }
        }
    }

    function handleReturn() {
        startTransition(async () => { await markAsReturned(loan.id) })
    }

    function handleDelete() {
        if (confirm('¿Estás seguro de eliminar este préstamo?')) {
            startTransition(async () => { await deleteLoan(loan.id) })
        }
    }

    async function handleAddPayment(e: React.FormEvent) {
        e.preventDefault()
        const cleanAmount = paymentAmount.replace(/,/g, '')
        const amount = parseFloat(cleanAmount)
        if (isNaN(amount) || amount <= 0) return

        startTransition(async () => {
            // Add optimistic payment
            setOptimisticLoan(amount)
            setOptimisticPayments({
                id: 'temp-' + Date.now(),
                loan_id: loan.id,
                user_id: '',
                amount: amount,
                notes: paymentNotes || null,
                payment_date: new Date().toISOString(),
                created_at: new Date().toISOString()
            })

            const result = await addPayment(loan.id, amount, paymentNotes)
            if (result.success) {
                setShowPaymentForm(false)
                setPaymentAmount('')
                setPaymentNotes('')
                // Refresh data to get actual IDs and sync
                const payData = await getPayments(loan.id)
                setPayments(payData)
            }
        })
    }

    function handleWhatsApp() {
        const phone = loan.contact?.phone?.replace(/[^0-9+]/g, '') || ''
        const amountStr = formatMoney(totalAmount, currency)
        const remainingStr = formatMoney(remaining, currency)
        const dateStr = format(new Date(loan.loan_date), 'dd/MM/yyyy')

        let messageText = `Hola ${loan.borrower_name} 👋\n\nTe escribo para recordarte el préstamo de *${amountStr}* del ${dateStr}.`

        if (totalPaid > 0) {
            messageText += `\nHas abonado: *${formatMoney(totalPaid, currency)}*`
            messageText += `\nSaldo pendiente: *${remainingStr}*`
        }

        if (loan.description) messageText += `\nMotivo: ${loan.description}`
        if (loan.due_date) messageText += `\nFecha estimada de devolución: ${format(new Date(loan.due_date), 'dd/MM/yyyy')}`

        const message = encodeURIComponent(messageText + `\n\n¡Gracias! 🙏`)
        const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`
        window.open(url, '_blank')
    }

    const transferAtt = (attachments ?? []).filter(a => a.type === 'transfer')
    const paymentAtt = (attachments ?? []).filter(a => a.type === 'payment')

    return (
        <Card className={`border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-zinc-700 ${isOverdue ? 'border-l-2 border-l-red-500' : ''}`}>
            {/* Header — always visible */}
            <div className="relative">
                <button onClick={handleExpand} className="w-full p-4 text-left pb-2">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-zinc-500 shrink-0" />
                                <span className="text-zinc-100 font-semibold truncate">{optimisticLoan.borrower_name}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-xl font-bold ${optimisticLoan.status === 'returned' ? 'text-zinc-500 line-through' : 'text-emerald-400'}`}>
                                    {formatMoney(totalAmount, currency)}
                                </span>
                                {totalPaid > 0 && optimisticLoan.status !== 'returned' && (
                                    <span className="text-xs text-emerald-500 font-medium">
                                        (Pendiente: {formatMoney(remaining, currency)})
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                            <Badge variant="outline" className={statusColor}>
                                {isOverdue && <AlertTriangle className="w-3 h-3 mr-1" />}
                                {statusLabel}
                            </Badge>
                            <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {/* Progress Bar (if active and has payments) */}
                    {optimisticLoan.status === 'active' && totalPaid > 0 && (
                        <div className="mt-3 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}

                    {optimisticLoan.description && (
                        <p className="text-zinc-500 text-sm mt-3 leading-relaxed border-t border-zinc-800/30 pt-2">{optimisticLoan.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(optimisticLoan.loan_date), 'dd MMM yyyy', { locale: es })}</span>
                        </div>
                        {optimisticLoan.due_date && (
                            <div className="flex items-center gap-1">
                                <span className="text-zinc-600">→</span>
                                <span className={isOverdue ? 'text-red-400' : ''}>
                                    {format(new Date(optimisticLoan.due_date), 'dd MMM yyyy', { locale: es })}
                                </span>
                            </div>
                        )}
                    </div>
                </button>
            </div>

            {/* Expanded body */}
            {expanded && (
                <div className="border-t border-zinc-800 animate-in slide-in-from-top-2 duration-200">
                    {/* Main Actions */}
                    {showActions && loan.status !== 'returned' && (
                        <div className="px-4 py-3 flex gap-2">
                            <Button
                                onClick={() => setShowPaymentForm(true)}
                                size="sm"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                                <Plus className="w-4 h-4 mr-1" /> Abonar
                            </Button>
                            <Button onClick={handleWhatsApp} size="sm" variant="outline" className="border-zinc-700 text-green-400 hover:bg-green-500/10">
                                <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button onClick={handleDelete} disabled={isPending} size="sm" variant="outline" className="border-zinc-700 text-red-400 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {optimisticLoan.status === 'returned' && (
                        <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800/50">
                            <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Pagado el {optimisticLoan.returned_date && format(new Date(optimisticLoan.returned_date), 'dd MMM yyyy', { locale: es })}</span>
                            </div>
                            <Button onClick={handleDelete} disabled={isPending} size="sm" variant="outline" className="h-8 border-zinc-700 text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Payment History Section */}
                    {totalPaid > 0 && optimisticPayments && (
                        <div className="px-4 py-3 bg-zinc-950/40">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                                    <History className="w-3 h-3" />
                                    <span>Historial de abonos</span>
                                </div>
                                <span className="text-[10px] text-zinc-500 font-medium">
                                    Total pagado: {formatMoney(totalPaid, currency)}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                {optimisticPayments.map(p => (
                                    <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/30 last:border-0">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-emerald-400">{formatMoney(Number(p.amount), currency)}</span>
                                            {p.notes && <span className="text-zinc-600 text-[9px] truncate max-w-[150px]">{p.notes}</span>}
                                        </div>
                                        <span className="text-zinc-600 text-[10px] uppercase font-mono">
                                            {format(new Date(p.payment_date), 'dd MMM', { locale: es })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Attachments Section */}
                    <div className="px-4 py-4 space-y-4">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>Evidencias</span>
                        </div>

                        {loadingData ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <LoanAttachments
                                    loanId={loan.id}
                                    type="transfer"
                                    attachments={transferAtt}
                                    label="📤 Evidencia de transferencia"
                                />
                                <LoanAttachments
                                    loanId={loan.id}
                                    type="payment"
                                    attachments={paymentAtt}
                                    label="📥 Comprobante de pago"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Inline Payment Form Overlay */}
            {showPaymentForm && (
                <div className="absolute inset-0 z-10 bg-zinc-950/95 p-4 flex flex-col justify-center animate-in fade-in duration-200">
                    <button
                        onClick={() => setShowPaymentForm(false)}
                        className="absolute top-2 right-2 p-2 text-zinc-500 hover:text-zinc-200"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center mb-6">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                            <HandCoins className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-zinc-100 font-bold">Registrar Abono</h3>
                        <p className="text-zinc-500 text-xs mt-1">
                            Saldo pendiente: <span className="text-emerald-400 font-bold">${remaining.toLocaleString('es-DO')}</span>
                        </p>
                    </div>

                    <form onSubmit={handleAddPayment} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Monto del abono</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">$</span>
                                <Input
                                    autoFocus
                                    type="text"
                                    inputMode="decimal"
                                    required
                                    placeholder="0.00"
                                    value={paymentAmount}
                                    onChange={handleAmountChange}
                                    className="bg-zinc-900 border-zinc-800 h-12 pl-7 text-lg font-bold text-zinc-100 focus:ring-emerald-500/30"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Notas (opcional)</label>
                            <Input
                                placeholder="Ej: Pago por transferencia"
                                value={paymentNotes}
                                onChange={e => setPaymentNotes(e.target.value)}
                                className="bg-zinc-900 border-zinc-800 h-10 text-sm text-zinc-100"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowPaymentForm(false)}
                                className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-400 h-12"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white h-12 font-bold shadow-lg shadow-emerald-600/20"
                            >
                                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Abono'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </Card>
    )
}
