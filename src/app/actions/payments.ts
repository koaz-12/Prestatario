'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addPayment(loanId: string, amount: number, notes?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // 1. Insert the payment
    const { data: payment, error: payError } = await supabase
        .from('loan_payments')
        .insert({
            loan_id: loanId,
            user_id: user.id,
            amount,
            notes: notes || null,
            payment_date: new Date().toISOString().split('T')[0],
        })
        .select('id')
        .single()

    if (payError) return { error: payError.message }

    // 2. Get current loan total_paid and amount
    const { data: loan } = await supabase
        .from('loans')
        .select('total_paid, amount')
        .eq('id', loanId)
        .single()

    if (!loan) return { error: 'Préstamo no encontrado' }

    const newTotalPaid = Number(loan.total_paid || 0) + amount
    const newStatus = newTotalPaid >= Number(loan.amount) ? 'returned' : 'active'

    // 3. Update total_paid and status
    await supabase.from('loans').update({
        total_paid: newTotalPaid,
        status: newStatus,
        returned_date: newStatus === 'returned' ? new Date().toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString()
    }).eq('id', loanId)

    revalidatePath('/dashboard')
    revalidatePath('/contacts')
    revalidatePath('/history')
    return { success: true }
}

export async function getPayments(loanId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('payment_date', { ascending: false })
    return data || []
}

export async function deletePayment(paymentId: string, loanId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // Get the payment amount before deleting
    const { data: payment } = await supabase
        .from('loan_payments')
        .select('amount')
        .eq('id', paymentId)
        .eq('user_id', user.id)
        .single()

    if (!payment) return { error: 'Pago no encontrado' }

    // Delete the payment
    const { error } = await supabase
        .from('loan_payments')
        .delete()
        .eq('id', paymentId)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    // Recalculate total_paid
    const { data: remainingPayments } = await supabase
        .from('loan_payments')
        .select('amount')
        .eq('loan_id', loanId)

    const newTotal = (remainingPayments || []).reduce((s, p) => s + Number(p.amount), 0)

    await supabase.from('loans').update({
        total_paid: newTotal,
        status: 'active',
        returned_date: null,
        updated_at: new Date().toISOString()
    }).eq('id', loanId)

    revalidatePath('/dashboard')
    revalidatePath('/contacts')
    revalidatePath('/history')
    return { success: true }
}
