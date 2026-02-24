import { getReportData } from '@/app/actions/reports'
import { getUserCurrency } from '@/app/actions/profile'
import { ReportsClient } from './ReportsClient'
import { redirect } from 'next/navigation'

export default async function ReportsPage() {
    const [data, currency] = await Promise.all([
        getReportData(),
        getUserCurrency()
    ])

    if (!data) {
        redirect('/login')
    }

    return <ReportsClient data={data} currency={currency} />
}
