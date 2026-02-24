'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCurrency(currency: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ currency })
        .eq('id', user.id)

    if (error) {
        console.error('Error updating currency:', error)
        return { error: 'Error al actualizar la moneda' }
    }

    revalidatePath('/profile')
    revalidatePath('/dashboard')
    revalidatePath('/history')
    return { success: true }
}

export async function getUserCurrency() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'DOP'

    const { data } = await supabase
        .from('profiles')
        .select('currency')
        .eq('id', user.id)
        .single()

    return data?.currency || 'DOP'
}
