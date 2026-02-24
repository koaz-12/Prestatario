'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, format, subMonths, eachMonthOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

export async function getReportData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch all loans to get "lent" amounts per month
    const { data: loans } = await supabase
        .from('loans')
        .select('amount, loan_date')
        .eq('user_id', user.id)

    // Fetch all payments to get "collected" amounts per month
    const { data: payments } = await supabase
        .from('loan_payments')
        .select('amount, payment_date')
        .eq('user_id', user.id)

    if (!loans || !payments) return null

    // Last 6 months interval
    const endDate = new Date()
    const startDate = subMonths(endDate, 5)
    const months = eachMonthOfInterval({ start: startDate, end: endDate })

    const monthlyData = months.map(monthDate => {
        const monthKey = format(monthDate, 'yyyy-MM')
        const monthLabel = format(monthDate, 'MMM', { locale: es })

        const lent = loans
            .filter(l => l.loan_date.startsWith(monthKey))
            .reduce((sum, l) => sum + Number(l.amount), 0)

        const collected = payments
            .filter(p => p.payment_date.startsWith(monthKey))
            .reduce((sum, p) => sum + Number(p.amount), 0)

        return {
            month: monthLabel,
            lent,
            collected,
            rawDate: monthDate
        }
    })

    const totalLent = loans.reduce((sum, l) => sum + Number(l.amount), 0)
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0)

    return {
        monthlyData,
        summary: {
            totalLent,
            totalCollected,
            balance: totalLent - totalCollected
        }
    }
}
