'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Plus, Loader2, Calendar, CheckCircle2, ArrowRight,
    User, DollarSign, FileText, Clock, ChevronRight,
    Camera, ImageIcon, X
} from 'lucide-react'
import { createLoan } from '@/app/actions/loans'
import { getContacts } from '@/app/actions/contacts'
import { uploadAttachment } from '@/app/actions/attachments'
import { LoanAttachments } from '@/components/loans/LoanAttachments'
import { formatAmount } from '@/lib/utils'
import { addDays, addWeeks, addMonths, format } from 'date-fns'
import type { Contact } from '@/lib/types'

const DATE_SUGGESTIONS = [
    { label: '1 sem', getValue: () => addWeeks(new Date(), 1) },
    { label: '15 días', getValue: () => addDays(new Date(), 15) },
    { label: '1 mes', getValue: () => addMonths(new Date(), 1) },
    { label: '2 meses', getValue: () => addMonths(new Date(), 2) },
    { label: '3 meses', getValue: () => addMonths(new Date(), 3) },
    { label: '6 meses', getValue: () => addMonths(new Date(), 6) },
]

interface NewLoanSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

function FieldGroup({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0 mt-0.5">
                {icon}
            </div>
            <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</label>
                {children}
            </div>
        </div>
    )
}

export function NewLoanSheet({ open, onOpenChange }: NewLoanSheetProps) {
    const [isPending, startTransition] = useTransition()
    const [contacts, setContacts] = useState<Contact[]>([])
    const [selectedContact, setSelectedContact] = useState('')
    const [borrowerName, setBorrowerName] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [createdLoanId, setCreatedLoanId] = useState<string | null>(null)

    const [amount, setAmount] = useState('')

    // Image selection state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [uploadingFiles, setUploadingFiles] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value
        setAmount(formatAmount(rawValue))
    }

    useEffect(() => {
        if (open) getContacts().then(setContacts)
    }, [open])

    function handleContactChange(contactId: string) {
        setSelectedContact(contactId)
        if (contactId && contactId !== 'none') {
            const c = contacts.find(c => c.id === contactId)
            if (c) setBorrowerName(c.name)
        }
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? [])
        setSelectedFiles(prev => [...prev, ...files])
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    function removeFile(index: number) {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    async function handleSubmit(formData: FormData) {
        setError(null)
        if (selectedContact && selectedContact !== 'none') formData.set('contactId', selectedContact)
        formData.set('borrowerName', borrowerName)

        // Use clean numeric amount
        const cleanAmount = amount.replace(/,/g, '')
        formData.set('amount', cleanAmount)

        if (dueDate) formData.set('dueDate', dueDate)

        startTransition(async () => {
            const result = await createLoan(formData)
            if (result?.error) {
                setError(result.error)
            } else if (result?.loanId) {
                const loanId = result.loanId

                // Upload files if any
                if (selectedFiles.length > 0) {
                    setUploadingFiles(true)
                    for (const file of selectedFiles) {
                        await uploadAttachment(loanId, file, 'transfer')
                    }
                    setUploadingFiles(false)
                }

                setCreatedLoanId(loanId)
            }
        })
    }

    function handleClose() {
        onOpenChange(false)
        setTimeout(() => {
            setBorrowerName(''); setSelectedContact(''); setDueDate('')
            setError(null); setCreatedLoanId(null); setSelectedFiles([])
        }, 300)
    }

    return (
        <Sheet open={open} onOpenChange={handleClose}>
            <SheetContent side="bottom" className="bg-zinc-950 border-zinc-800 rounded-t-[28px] max-h-[92vh] overflow-y-auto p-0">
                <SheetTitle className="sr-only">Nuevo Préstamo</SheetTitle>

                {/* ── Step 2: Confirmation ── */}
                {createdLoanId ? (
                    <div className="p-6 space-y-6">
                        {/* Success banner */}
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-emerald-400">¡Préstamo registrado!</p>
                                <p className="text-xs text-zinc-500">
                                    {selectedFiles.length > 0
                                        ? `Se han subido ${selectedFiles.length} foto(s) de la transferencia.`
                                        : 'Puedes subir más fotos de la transferencia si lo deseas.'
                                    }
                                </p>
                            </div>
                        </div>

                        <LoanAttachments
                            loanId={createdLoanId}
                            type="transfer"
                            attachments={[]} // It will fetch existing ones internally if needed, or we just show it for adding more
                            label="📤 Evidencia de transferencia"
                        />

                        <Button onClick={handleClose}
                            className="w-full h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-sm">
                            Listo <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                ) : (
                    /* ── Step 1: Form ── */
                    <>
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-zinc-700" />
                        </div>

                        {/* Header */}
                        <div className="px-6 pt-2 pb-4 flex items-center gap-3 border-b border-zinc-800/60">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Plus className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-zinc-100">Nuevo Préstamo</h2>
                                <p className="text-xs text-zinc-500">Registra tu préstamo</p>
                            </div>
                        </div>

                        <form action={handleSubmit} className="px-6 py-5 space-y-5 pb-8">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Contact */}
                            <FieldGroup icon={<User className="w-4 h-4 text-zinc-400" />} label="Cliente">
                                <Select value={selectedContact} onValueChange={handleContactChange}>
                                    <SelectTrigger className="h-11 bg-zinc-900/80 border-zinc-700/60 text-zinc-100 rounded-xl focus:ring-emerald-500/30 focus:border-emerald-500/50">
                                        <SelectValue placeholder="Seleccionar cliente guardado..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-700 rounded-xl">
                                        <SelectItem value="none" className="text-zinc-400">Sin cliente guardado</SelectItem>
                                        {contacts.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="text-zinc-100">
                                                {c.name}{c.phone ? ` · ${c.phone}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    value={borrowerName}
                                    onChange={(e) => setBorrowerName(e.target.value)}
                                    placeholder="O escribe el nombre..."
                                    required
                                    className="h-11 bg-zinc-900/80 border-zinc-700/60 text-zinc-100 placeholder:text-zinc-600 rounded-xl focus:ring-emerald-500/30 focus:border-emerald-500/50"
                                />
                            </FieldGroup>

                            {/* Amount */}
                            <FieldGroup icon={<DollarSign className="w-4 h-4 text-emerald-400" />} label="Monto">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-lg">$</span>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        placeholder="0.00"
                                        required
                                        className="h-14 pl-10 bg-zinc-900/80 border-zinc-700/60 text-zinc-100 placeholder:text-zinc-600 rounded-xl text-2xl font-bold focus:ring-emerald-500/30 focus:border-emerald-500/50"
                                    />
                                    {/* Validar que el name='amount' no se pierda si hay un form nativo, 
                                        pero aquí usamos handleSubmit que lee el estado o formData manualmente. 
                                        Como he modificado handleSubmit para leer 'amount' desde el estado (o limpiar el formData), 
                                        esto funcionará. */}
                                </div>
                            </FieldGroup>

                            {/* Description */}
                            <FieldGroup icon={<FileText className="w-4 h-4 text-zinc-400" />} label="Descripción (opcional)">
                                <Textarea
                                    name="description"
                                    placeholder="¿Para qué es el préstamo?"
                                    rows={2}
                                    className="bg-zinc-900/80 border-zinc-700/60 text-zinc-100 placeholder:text-zinc-600 rounded-xl resize-none focus:ring-emerald-500/30 focus:border-emerald-500/50"
                                />
                            </FieldGroup>

                            {/* Dates */}
                            <FieldGroup icon={<Calendar className="w-4 h-4 text-zinc-400" />} label="Fechas">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-[10px] text-zinc-600 mb-1">Fecha del préstamo *</p>
                                        <Input
                                            name="loanDate" type="date"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                            required
                                            className="h-10 bg-zinc-900/80 border-zinc-700/60 text-zinc-100 rounded-xl text-sm focus:ring-emerald-500/30 focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-600 mb-1">Devolución estimada</p>
                                        <Input
                                            name="dueDate" type="date"
                                            value={dueDate} onChange={e => setDueDate(e.target.value)}
                                            className="h-10 bg-zinc-900/80 border-zinc-700/60 text-zinc-100 rounded-xl text-sm focus:ring-emerald-500/30 focus:border-emerald-500/50"
                                        />
                                    </div>
                                </div>

                                {/* Quick picks */}
                                <div>
                                    <p className="text-[10px] text-zinc-600 mb-2 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Sugerencias rápidas
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {DATE_SUGGESTIONS.map(s => {
                                            const val = format(s.getValue(), 'yyyy-MM-dd')
                                            const active = dueDate === val
                                            return (
                                                <button key={s.label} type="button"
                                                    onClick={() => setDueDate(active ? '' : val)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all active:scale-95 ${active
                                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                                        : 'bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:border-zinc-600'
                                                        }`}
                                                >
                                                    {s.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </FieldGroup>

                            {/* Images / Evidence */}
                            <FieldGroup icon={<Camera className="w-4 h-4 text-zinc-400" />} label="Evidencia fotográfica">
                                <div className="space-y-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />

                                    {selectedFiles.length === 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-16 rounded-xl border border-dashed border-zinc-700 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:border-zinc-600 hover:bg-zinc-900/40 transition-all"
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                            <span className="text-[10px] font-medium uppercase tracking-tight">Adjuntar transferencia</span>
                                        </button>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedFiles.map((file, i) => (
                                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(i)}
                                                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                                                    >
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-16 h-16 rounded-lg border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 hover:border-zinc-600 transition-all"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </FieldGroup>

                            {/* Submit */}
                            <Button type="submit" disabled={isPending || uploadingFiles}
                                className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-base shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98]">
                                {isPending || uploadingFiles ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{uploadingFiles ? 'Subiendo fotos...' : 'Guardando...'}</>
                                ) : (
                                    <>Registrar Préstamo <ChevronRight className="w-5 h-5 ml-1" /></>
                                )}
                            </Button>
                        </form>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
