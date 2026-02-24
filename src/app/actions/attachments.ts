'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { LoanAttachment } from '@/lib/types'

const BUCKET = 'loan-evidence'

export async function uploadAttachment(
    loanId: string,
    file: File,
    type: 'transfer' | 'payment'
): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filePath = `${user.id}/${loanId}/${type}_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { upsert: false })

    if (uploadError) return { error: uploadError.message }

    const { error: dbError } = await supabase
        .from('loan_attachments')
        .insert({
            loan_id: loanId,
            user_id: user.id,
            file_path: filePath,
            file_name: file.name,
            type,
        })

    if (dbError) return { error: dbError.message }

    revalidatePath('/dashboard')
    revalidatePath('/history')
    return {}
}

export async function getAttachments(loanId: string): Promise<LoanAttachment[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('loan_attachments')
        .select('*')
        .eq('loan_id', loanId)
        .order('created_at', { ascending: true })

    if (error || !data) return []

    // Generate signed URLs (valid 1 hour)
    const withUrls = await Promise.all(
        data.map(async (att) => {
            const { data: signed } = await supabase.storage
                .from(BUCKET)
                .createSignedUrl(att.file_path, 3600)
            return { ...att, url: signed?.signedUrl }
        })
    )

    return withUrls as LoanAttachment[]
}

export async function deleteAttachment(
    id: string,
    filePath: string
): Promise<{ error?: string }> {
    const supabase = await createClient()

    const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([filePath])

    if (storageError) return { error: storageError.message }

    const { error: dbError } = await supabase
        .from('loan_attachments')
        .delete()
        .eq('id', id)

    if (dbError) return { error: dbError.message }

    revalidatePath('/dashboard')
    revalidatePath('/history')
    return {}
}
