'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getContacts() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching contacts:', error)
        return []
    }
    return data || []
}

export async function createContact(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string || null
    const notes = formData.get('notes') as string || null

    if (!name) {
        return { error: 'El nombre es requerido' }
    }

    const { error } = await supabase.from('contacts').insert({
        user_id: user.id,
        name,
        phone,
        notes,
    })

    if (error) {
        console.error('Error creating contact:', error)
        return { error: error.message }
    }

    revalidatePath('/contacts')
    return { success: true }
}

export async function updateContact(contactId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string || null
    const notes = formData.get('notes') as string || null

    const { error } = await supabase
        .from('contacts')
        .update({
            name,
            phone,
            notes,
            updated_at: new Date().toISOString(),
        })
        .eq('id', contactId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating contact:', error)
        return { error: error.message }
    }

    revalidatePath('/contacts')
    return { success: true }
}

export async function deleteContact(contactId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting contact:', error)
        return { error: error.message }
    }

    revalidatePath('/contacts')
    return { success: true }
}

export async function getContactDetail(contactId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch contact
    const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .eq('user_id', user.id)
        .single()

    if (contactError || !contact) return null

    // Fetch all loans for this contact
    const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .order('loan_date', { ascending: false })

    if (loansError) return null

    // Fetch all payments for this contact
    const { data: payments, error: paymentsError } = await supabase
        .from('loan_payments')
        .select('*, loans(borrower_name, amount)')
        .eq('user_id', user.id)
        .in('loan_id', loans.map(l => l.id))
        .order('payment_date', { ascending: false })

    const stats = {
        totalBorrowed: loans.reduce((sum, l) => sum + Number(l.amount), 0),
        totalPaid: loans.reduce((sum, l) => sum + Number(l.total_paid || 0), 0),
        activeLoans: loans.filter(l => l.status === 'active' || l.status === 'overdue').length,
    }

    return {
        contact,
        loans,
        payments: payments || [],
        stats: {
            ...stats,
            balance: stats.totalBorrowed - stats.totalPaid
        }
    }
}
