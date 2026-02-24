'use client'

import { useState, useRef, useTransition } from 'react'
import { Camera, Trash2, Loader2, ZoomIn, X, ImageIcon } from 'lucide-react'
import { uploadAttachment, deleteAttachment } from '@/app/actions/attachments'
import type { LoanAttachment } from '@/lib/types'
import Image from 'next/image'

interface LoanAttachmentsProps {
    loanId: string
    type: 'transfer' | 'payment'
    attachments: LoanAttachment[]
    label: string
}

export function LoanAttachments({ loanId, type, attachments, label }: LoanAttachmentsProps) {
    const [items, setItems] = useState<LoanAttachment[]>(attachments)
    const [lightbox, setLightbox] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? [])
        if (!files.length) return
        setUploading(true)

        for (const file of files) {
            const result = await uploadAttachment(loanId, file, type)
            if (!result.error) {
                // Optimistically create a preview URL
                const url = URL.createObjectURL(file)
                setItems(prev => [...prev, {
                    id: `tmp_${Date.now()}`,
                    loan_id: loanId,
                    user_id: '',
                    file_path: '',
                    file_name: file.name,
                    type,
                    created_at: new Date().toISOString(),
                    url,
                }])
            }
        }
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ''
    }

    function handleDelete(id: string, filePath: string) {
        startTransition(async () => {
            await deleteAttachment(id, filePath)
            setItems(prev => prev.filter(a => a.id !== id))
        })
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">{label}</span>
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                    {uploading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Camera className="w-3.5 h-3.5" />
                    }
                    Añadir foto
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFiles}
                />
            </div>

            {items.length === 0 ? (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-full h-16 rounded-xl border border-dashed border-zinc-700 flex items-center justify-center gap-2 text-zinc-600 hover:border-zinc-600 hover:text-zinc-500 transition-colors"
                >
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs">Toca para subir evidencia</span>
                </button>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {items.map((att) => (
                        <div key={att.id} className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-800">
                            {att.url ? (
                                <img
                                    src={att.url}
                                    alt={att.file_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                                </div>
                            )}
                            {/* Overlay actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-active:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                {att.url && (
                                    <button
                                        type="button"
                                        onClick={() => setLightbox(att.url!)}
                                        className="p-1.5 rounded-lg bg-white/10 text-white"
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                )}
                                {att.file_path && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(att.id, att.file_path)}
                                        disabled={isPending}
                                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {/* Add more button */}
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="aspect-square rounded-xl border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 hover:border-zinc-500 hover:text-zinc-500 transition-colors"
                    >
                        <Camera className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white"
                        onClick={() => setLightbox(null)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <img
                        src={lightbox}
                        alt="Evidencia"
                        className="max-w-full max-h-full rounded-xl object-contain"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}
