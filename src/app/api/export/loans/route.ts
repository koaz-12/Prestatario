import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: loans } = await supabase
        .from('loans')
        .select('*, contact:contacts(name, phone)')
        .eq('user_id', user.id)
        .order('loan_date', { ascending: false })

    if (!loans) return NextResponse.json({ error: 'Error' }, { status: 500 })

    const rows = loans.map(loan => ({
        'Prestatario': loan.borrower_name,
        'Teléfono': loan.contact?.phone || '',
        'Monto': Number(loan.amount),
        'Total Pagado': Number(loan.total_paid || 0),
        'Pendiente': Number(loan.amount) - Number(loan.total_paid || 0),
        'Interés (%)': Number(loan.interest_rate || 0),
        'Cuotas': loan.installments || 1,
        'Estado': loan.status === 'returned' ? 'Devuelto' : loan.status === 'overdue' ? 'Vencido' : 'Activo',
        'Etiquetas': (loan.tags || []).join(', '),
        'Descripción': loan.description || '',
        'Fecha Préstamo': loan.loan_date,
        'Fecha Vencimiento': loan.due_date || '',
        'Fecha Devuelto': loan.returned_date || '',
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Préstamos')

    // Auto width
    const colWidths = Object.keys(rows[0] || {}).map(k => ({ wch: Math.max(k.length, 12) }))
    ws['!cols'] = colWidths

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="prestamos-${new Date().toISOString().split('T')[0]}.xlsx"`,
        }
    })
}
