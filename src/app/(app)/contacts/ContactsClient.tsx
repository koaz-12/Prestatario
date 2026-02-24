'use client'

import { useState, useTransition, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { TopHeader } from '@/components/navigation/TopHeader'
import Link from 'next/link'
import {
    Users,
    User,
    Plus,
    Phone,
    Trash2,
    Edit3,
    Loader2,
    Search,
    UserPlus,
    StickyNote,
} from 'lucide-react'
import { createContact, deleteContact, updateContact } from '@/app/actions/contacts'
import { cacheContacts, getCachedContacts } from '@/lib/offline/db'
import { useOnlineStatus } from '@/lib/offline/useOnlineStatus'
import type { Contact } from '@/lib/types'

interface ContactsClientProps {
    contacts: Contact[]
}

export function ContactsClient({ contacts: initialContacts }: ContactsClientProps) {
    const [search, setSearch] = useState('')
    const [isPending, startTransition] = useTransition()
    const [addOpen, setAddOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [editingContact, setEditingContact] = useState<Contact | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [contacts, setContacts] = useState<Contact[]>(initialContacts)
    const isOnline = useOnlineStatus()

    useEffect(() => {
        if (initialContacts.length > 0) {
            cacheContacts(initialContacts)
            setContacts(initialContacts)
        } else if (!isOnline) {
            getCachedContacts().then(cached => {
                if (cached.length > 0) setContacts(cached)
            })
        }
    }, [initialContacts, isOnline])

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search))
    )

    async function handleCreate(formData: FormData) {
        setError(null)
        startTransition(async () => {
            const result = await createContact(formData)
            if (result?.error) {
                setError(result.error)
            } else {
                setAddOpen(false)
                setError(null)
            }
        })
    }

    async function handleUpdate(formData: FormData) {
        if (!editingContact) return
        setError(null)
        startTransition(async () => {
            const result = await updateContact(editingContact.id, formData)
            if (result?.error) {
                setError(result.error)
            } else {
                setEditOpen(false)
                setEditingContact(null)
                setError(null)
            }
        })
    }

    function handleEdit(contact: Contact) {
        setEditingContact(contact)
        setEditOpen(true)
    }

    function handleDelete(contactId: string) {
        if (confirm('¿Eliminar este cliente? Los préstamos asociados no se eliminarán.')) {
            startTransition(async () => {
                await deleteContact(contactId)
            })
        }
    }

    return (
        <div>
            <TopHeader title="Clientes" subtitle="Personas a las que prestas" />
            <div className="px-4 space-y-4">
                {/* Add button + Search */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar clientes..."
                            className="pl-10 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                        />
                    </div>
                    <Sheet open={addOpen} onOpenChange={setAddOpen}>
                        <SheetTrigger asChild>
                            <Button size="icon" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 h-9 w-9 rounded-xl">
                                <UserPlus className="w-4 h-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="bg-zinc-950 border-zinc-800 rounded-t-[28px] p-0">
                            <SheetTitle className="sr-only">Nuevo Cliente</SheetTitle>
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 rounded-full bg-zinc-700" />
                            </div>
                            {/* Header */}
                            <div className="px-6 pt-2 pb-4 flex items-center gap-3 border-b border-zinc-800/60">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <UserPlus className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-zinc-100">Nuevo Cliente</h2>
                                    <p className="text-xs text-zinc-500">Agrega un contacto para préstamos rápidos</p>
                                </div>
                            </div>
                            <form action={handleCreate} className="px-6 py-5 space-y-5 pb-8">
                                {error && (
                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />{error}
                                    </div>
                                )}
                                {/* Name */}
                                <div className="flex gap-3 items-start">
                                    <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0 mt-0.5">
                                        <User className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nombre *</label>
                                        <Input name="name" placeholder="¿Cómo se llama?" required
                                            className="h-11 bg-zinc-900/80 border-zinc-700/60 text-zinc-100 placeholder:text-zinc-600 rounded-xl" />
                                    </div>
                                </div>
                                {/* Phone */}
                                <div className="flex gap-3 items-start">
                                    <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0 mt-0.5">
                                        <Phone className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Teléfono</label>
                                        <Input name="phone" type="tel" placeholder="+1 (809) 000-0000"
                                            className="h-11 bg-zinc-900/80 border-zinc-700/60 text-zinc-100 placeholder:text-zinc-600 rounded-xl" />
                                    </div>
                                </div>
                                {/* Notes */}
                                <div className="flex gap-3 items-start">
                                    <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0 mt-0.5">
                                        <StickyNote className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Notas</label>
                                        <Textarea name="notes" placeholder="Apuntes sobre este cliente..." rows={2}
                                            className="bg-zinc-900/80 border-zinc-700/60 text-zinc-100 placeholder:text-zinc-600 rounded-xl resize-none" />
                                    </div>
                                </div>
                                <Button type="submit" disabled={isPending}
                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-base shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all">
                                    {isPending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Guardando...</> : 'Guardar Cliente'}
                                </Button>
                            </form>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Contacts List */}
                {filteredContacts.length === 0 ? (
                    <Card className="p-8 border-zinc-800 bg-zinc-900/40 text-center">
                        <Users className="w-12 h-12 mx-auto text-zinc-700 mb-3" />
                        <p className="text-zinc-500">
                            {search ? 'No se encontraron clientes' : 'No tienes clientes guardados'}
                        </p>
                        <p className="text-zinc-600 text-sm mt-1">
                            {!search && 'Agrega clientes para seleccionarlos rápidamente al crear préstamos'}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {filteredContacts.map((contact) => (
                            <Card
                                key={contact.id}
                                className="p-4 border-zinc-800 bg-zinc-900/60 backdrop-blur-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3 flex-1 min-w-0 group/link">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 group-hover/link:bg-zinc-700 transition-colors">
                                            <span className="text-sm font-bold text-zinc-400 group-hover/link:text-zinc-200">
                                                {contact.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-zinc-100 truncate group-hover/link:text-white transition-colors">{contact.name}</p>
                                            {contact.phone && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Phone className="w-3 h-3 text-zinc-500" />
                                                    <span className="text-sm text-zinc-400">{contact.phone}</span>
                                                </div>
                                            )}
                                            {contact.notes && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <StickyNote className="w-3 h-3 text-zinc-600" />
                                                    <span className="text-xs text-zinc-500 truncate">{contact.notes}</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => handleEdit(contact)}
                                            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contact.id)}
                                            disabled={isPending}
                                            className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Edit Sheet */}
                <Sheet open={editOpen} onOpenChange={setEditOpen}>
                    <SheetContent side="bottom" className="bg-zinc-950 border-zinc-800 rounded-t-[28px] p-0">
                        <SheetTitle className="sr-only">Editar Cliente</SheetTitle>
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-zinc-700" />
                        </div>
                        <div className="px-6 pt-2 pb-4 flex items-center gap-3 border-b border-zinc-800/60">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center shadow-lg">
                                <Edit3 className="w-5 h-5 text-zinc-300" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-zinc-100">Editar Cliente</h2>
                                <p className="text-xs text-zinc-500">{editingContact?.name}</p>
                            </div>
                        </div>
                        {editingContact && (
                            <form action={handleUpdate} className="px-6 py-5 space-y-5 pb-8">
                                {error && (
                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />{error}
                                    </div>
                                )}
                                <div className="flex gap-3 items-start">
                                    <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0 mt-0.5">
                                        <User className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nombre *</label>
                                        <Input name="name" defaultValue={editingContact.name} required
                                            className="h-11 bg-zinc-900/80 border-zinc-700/60 text-zinc-100 rounded-xl" />
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0 mt-0.5">
                                        <Phone className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Teléfono</label>
                                        <Input name="phone" type="tel" defaultValue={editingContact.phone || ''}
                                            className="h-11 bg-zinc-900/80 border-zinc-700/60 text-zinc-100 rounded-xl" />
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0 mt-0.5">
                                        <StickyNote className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Notas</label>
                                        <Textarea name="notes" defaultValue={editingContact.notes || ''} rows={2}
                                            className="bg-zinc-900/80 border-zinc-700/60 text-zinc-100 rounded-xl resize-none" />
                                    </div>
                                </div>
                                <Button type="submit" disabled={isPending}
                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-base shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all">
                                    {isPending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Guardando...</> : 'Actualizar Cliente'}
                                </Button>
                            </form>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    )
}
