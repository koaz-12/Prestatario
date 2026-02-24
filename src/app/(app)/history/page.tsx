import { getLoans } from '@/app/actions/loans'
import { getUserCurrency } from '@/app/actions/profile'
import { HistoryClient } from './HistoryClient'

export default async function HistoryPage() {
    const [loans, currency] = await Promise.all([
        getLoans('returned'),
        getUserCurrency()
    ])
    return <HistoryClient loans={loans} currency={currency} />
}
