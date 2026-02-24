'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addPayment(loanId: string, amount: number, notes?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // 1. Get current loan to check balance
    const { data: loan, error: fetchError } = await supabase
        .from('loans')
        .select('amount, total_paid, contact_id')
        .eq('id', loanId)
        .single()

    if (fetchError || !loan) {
        return { error: 'No se encontró el préstamo' }
    }

    const currentPaid = Number(loan.total_paid || 0)
    const newTotalPaid = currentPaid + amount
    const remaining = Number(loan.amount) - newTotalPaid

    // 2. Insert payment
    const { error: paymentError } = await supabase
        .from('loan_payments')
        .insert({
            loan_id: loanId,
            user_id: user.id,
            amount,
            notes: notes || null,
        })

    if (paymentError) {
        return { error: paymentError.message }
    }

    // 3. Update loan with new total_paid and status if completed
    const updates: any = {
        total_paid: newTotalPaid,
        updated_at: new Date().toISOString()
    }

    if (remaining <= 0) {
        updates.status = 'returned'
        updates.returned_date = new Date().toISOString().split('T')[0]
    }

    const { error: updateError } = await supabase
        .from('loans')
        .update(updates)
        .eq('id', loanId)

    if (updateError) {
        return { error: updateError.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/history')
    if (loan.contact_id) {
        revalidatePath(`/contacts/${loan.contact_id}`)
    }
    return { success: true }
}

export async function getPayments(loanId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching payments:', error)
        return []
    }
    return data || []
}
