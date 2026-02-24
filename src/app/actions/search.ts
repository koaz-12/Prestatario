'use server'

import { createClient } from '@/lib/supabase/server'

export async function searchAll(query: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const q = `%${query}%`

    const [loansRes, contactsRes] = await Promise.all([
        supabase
            .from('loans')
            .select('id, borrower_name, amount, status, loan_date')
            .eq('user_id', user.id)
            .ilike('borrower_name', q)
            .limit(5),
        supabase
            .from('contacts')
            .select('id, name, phone')
            .eq('user_id', user.id)
            .ilike('name', q)
            .limit(5)
    ])

    const results: any[] = []

    if (loansRes.data) {
        for (const loan of loansRes.data) {
            results.push({
                type: 'loan',
                id: loan.id,
                title: loan.borrower_name,
                subtitle: `Préstamo del ${new Date(loan.loan_date).toLocaleDateString('es-DO')} · ${loan.status === 'returned' ? 'Devuelto' : loan.status === 'overdue' ? 'Vencido' : 'Activo'}`,
                href: '/dashboard',
                amount: Number(loan.amount)
            })
        }
    }

    if (contactsRes.data) {
        for (const contact of contactsRes.data) {
            results.push({
                type: 'contact',
                id: contact.id,
                title: contact.name,
                subtitle: contact.phone ? `📞 ${contact.phone}` : 'Sin teléfono',
                href: `/contacts/${contact.id}`
            })
        }
    }

    return results
}
