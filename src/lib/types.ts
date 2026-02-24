export type Profile = {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    currency: string
    created_at: string
    updated_at: string
}

export type Contact = {
    id: string
    user_id: string
    name: string
    phone: string | null
    notes: string | null
    created_at: string
    updated_at: string
}

export type Loan = {
    id: string
    user_id: string
    contact_id: string | null
    borrower_name: string
    amount: number
    total_paid: number
    description: string | null
    loan_date: string
    due_date: string | null
    returned_date: string | null
    status: 'active' | 'returned' | 'overdue'
    interest_rate: number | null
    installments: number | null
    tags: string[] | null
    created_at: string
    updated_at: string
    // Joined fields
    contact?: Contact
}

export type LoanWithContact = Loan & {
    contact: Contact | null
}

export type DashboardStats = {
    totalActive: number
    totalAmountOut: number
    overdueCount: number
    totalLoans: number
}

export type LoanAttachment = {
    id: string
    loan_id: string
    user_id: string
    file_path: string
    file_name: string
    type: 'transfer' | 'payment'
    created_at: string
    // Signed URL for display (not in DB)
    url?: string
}

export type LoanPayment = {
    id: string
    loan_id: string
    user_id: string
    amount: number
    payment_date: string
    notes: string | null
    created_at: string
}
