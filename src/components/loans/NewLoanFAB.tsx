'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2, Calendar } from 'lucide-react'
import { createLoan } from '@/app/actions/loans'
import { getContacts } from '@/app/actions/contacts'
import { addDays, addWeeks, addMonths, format } from 'date-fns'
import type { Contact } from '@/lib/types'

const DATE_SUGGESTIONS = [
    { label: '1 semana', getValue: () => addWeeks(new Date(), 1) },
    { label: '15 días', getValue: () => addDays(new Date(), 15) },
    { label: '1 mes', getValue: () => addMonths(new Date(), 1) },
    { label: '2 meses', getValue: () => addMonths(new Date(), 2) },
    { label: '3 meses', getValue: () => addMonths(new Date(), 3) },
    { label: '6 meses', getValue: () => addMonths(new Date(), 6) },
]

export function NewLoanFAB() {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [contacts, setContacts] = useState<Contact[]>([])
    const [selectedContact, setSelectedContact] = useState<string>('')
    const [borrowerName, setBorrowerName] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [error, setError] = useState<string | null>(null)
    const dueDateRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            getContacts().then(setContacts)
        }
    }, [open])

    function handleContactChange(contactId: string) {
        setSelectedContact(contactId)
        if (contactId && contactId !== 'none') {
            const contact = contacts.find(c => c.id === contactId)
            if (contact) {
                setBorrowerName(contact.name)
            }
        }
    }

    function handleDateSuggestion(getValue: () => Date) {
        const date = getValue()
        const formatted = format(date, 'yyyy-MM-dd')
        setDueDate(formatted)
        if (dueDateRef.current) {
            dueDateRef.current.value = formatted
        }
    }

    async function handleSubmit(formData: FormData) {
        setError(null)
        if (selectedContact && selectedContact !== 'none') {
            formData.set('contactId', selectedContact)
        }
        formData.set('borrowerName', borrowerName)
        if (dueDate) {
            formData.set('dueDate', dueDate)
        }

        startTransition(async () => {
            const result = await createLoan(formData)
            if (result?.error) {
                setError(result.error)
            } else {
                setOpen(false)
                setBorrowerName('')
                setSelectedContact('')
                setDueDate('')
                setError(null)
            }
        })
    }

    return (
        <>
            {/* FAB Button */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <button className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200">
                        <Plus className="w-6 h-6" />
                    </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-zinc-950 border-zinc-800 rounded-t-3xl max-h-[85vh] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="text-zinc-100 text-lg">Nuevo Préstamo</SheetTitle>
                    </SheetHeader>

                    <form action={handleSubmit} className="space-y-4 mt-4 pb-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Contact selector */}
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Cliente (opcional)</Label>
                            <Select value={selectedContact} onValueChange={handleContactChange}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                                    <SelectValue placeholder="Seleccionar cliente..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-700">
                                    <SelectItem value="none" className="text-zinc-400">Sin cliente guardado</SelectItem>
                                    {contacts.map((contact) => (
                                        <SelectItem key={contact.id} value={contact.id} className="text-zinc-100">
                                            {contact.name} {contact.phone ? `(${contact.phone})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Borrower name */}
                        <div className="space-y-2">
                            <Label htmlFor="borrowerName" className="text-zinc-300">Nombre del prestatario *</Label>
                            <Input
                                id="borrowerName"
                                value={borrowerName}
                                onChange={(e) => setBorrowerName(e.target.value)}
                                placeholder="¿A quién le prestas?"
                                required
                                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                            />
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-zinc-300">Monto *</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">$</span>
                                <Input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="0.00"
                                    required
                                    className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 pl-8 text-lg font-semibold"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-zinc-300">Descripción (opcional)</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="¿Para qué es el préstamo?"
                                rows={2}
                                className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 resize-none"
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="loanDate" className="text-zinc-300">Fecha de préstamo *</Label>
                                <Input
                                    id="loanDate"
                                    name="loanDate"
                                    type="date"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    required
                                    className="bg-zinc-900 border-zinc-700 text-zinc-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dueDate" className="text-zinc-300">Fecha de devolución</Label>
                                <Input
                                    ref={dueDateRef}
                                    id="dueDate"
                                    name="dueDate"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="bg-zinc-900 border-zinc-700 text-zinc-100"
                                />
                            </div>
                        </div>

                        {/* Quick date suggestions */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                                <Calendar className="w-3 h-3" />
                                <span>Sugerencias de devolución</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {DATE_SUGGESTIONS.map((suggestion) => (
                                    <button
                                        key={suggestion.label}
                                        type="button"
                                        onClick={() => handleDateSuggestion(suggestion.getValue)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 active:scale-95 ${dueDate === format(suggestion.getValue(), 'yyyy-MM-dd')
                                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                                            }`}
                                    >
                                        {suggestion.label}
                                    </button>
                                ))}
                                {dueDate && (
                                    <button
                                        type="button"
                                        onClick={() => { setDueDate(''); if (dueDateRef.current) dueDateRef.current.value = ''; }}
                                        className="px-3 py-1.5 rounded-full text-xs font-medium border border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all active:scale-95"
                                    >
                                        Sin fecha
                                    </button>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/20 h-12 text-base"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Registrar Préstamo
                                </>
                            )}
                        </Button>
                    </form>
                </SheetContent>
            </Sheet>
        </>
    )
}
