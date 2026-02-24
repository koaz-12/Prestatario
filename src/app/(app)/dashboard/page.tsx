import { getDashboardStats, getLoans } from '@/app/actions/loans'
import { getUserCurrency } from '@/app/actions/profile'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
    const [stats, loans, currency] = await Promise.all([
        getDashboardStats(),
        getLoans('active'),
        getUserCurrency()
    ])

    // Also get overdue
    const allLoans = await getLoans()
    const activeAndOverdue = allLoans.filter(l => l.status === 'active' || l.status === 'overdue')

    return <DashboardClient stats={stats} loans={activeAndOverdue} currency={currency} />
}
