'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getLoans(status?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
        .from('loans')
        .select('*, contact:contacts(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (status && status !== 'all') {
        query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) {
        console.error('Error fetching loans:', error)
        return []
    }
    return data || []
}

export async function getDashboardStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { totalActive: 0, totalAmountOut: 0, overdueCount: 0, totalLoans: 0 }

    const { data: loans } = await supabase
        .from('loans')
        .select('amount, total_paid, status')
        .eq('user_id', user.id)

    if (!loans) return { totalActive: 0, totalAmountOut: 0, overdueCount: 0, totalLoans: 0 }

    const activeLoans = loans.filter(l => l.status === 'active')
    const overdueLoans = loans.filter(l => l.status === 'overdue')

    // Total Amount Out = Sum of (amount - total_paid) for all active/overdue loans
    const totalAmountOut = [...activeLoans, ...overdueLoans].reduce(
        (sum, l) => sum + (Number(l.amount) - Number(l.total_paid || 0)),
        0
    )

    return {
        totalActive: activeLoans.length,
        totalAmountOut,
        overdueCount: overdueLoans.length,
        totalLoans: loans.length,
    }
}

export async function createLoan(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const borrowerName = formData.get('borrowerName') as string
    const amount = parseFloat(formData.get('amount') as string)
    const description = formData.get('description') as string || null
    const loanDate = formData.get('loanDate') as string
    const dueDate = formData.get('dueDate') as string || null
    const contactId = formData.get('contactId') as string || null
    const interestRate = formData.get('interestRate') ? parseFloat(formData.get('interestRate') as string) : 0
    const installments = formData.get('installments') ? parseInt(formData.get('installments') as string) : 1
    const tagsRaw = formData.get('tags') as string
    const tags = tagsRaw ? JSON.parse(tagsRaw) : []

    if (!borrowerName || !amount || !loanDate) {
        return { error: 'Faltan campos requeridos' }
    }

    const { data, error } = await supabase.from('loans').insert({
        user_id: user.id,
        contact_id: contactId || null,
        borrower_name: borrowerName,
        amount,
        description,
        loan_date: loanDate,
        due_date: dueDate || null,
        status: 'active',
        interest_rate: interestRate,
        installments: installments,
        tags: tags,
    }).select('id').single()

    if (error) {
        console.error('Error creating loan:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, loanId: data.id }
}

export async function markAsReturned(loanId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase
        .from('loans')
        .update({
            status: 'returned',
            returned_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
        })
        .eq('id', loanId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error marking as returned:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/history')
    return { success: true }
}

export async function deleteLoan(loanId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', loanId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting loan:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/history')
    return { success: true }
}
