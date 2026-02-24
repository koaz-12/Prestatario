import { getContactDetail } from '@/app/actions/contacts'
import { getUserCurrency } from '@/app/actions/profile'
import { ContactDetailClient } from './ContactDetailClient'
import { notFound } from 'next/navigation'

interface ContactPageProps {
    params: Promise<{ id: string }>
}

export default async function ContactPage({ params }: ContactPageProps) {
    const { id } = await params
    const [detail, currency] = await Promise.all([
        getContactDetail(id),
        getUserCurrency()
    ])

    if (!detail) {
        notFound()
    }

    return <ContactDetailClient detail={detail} currency={currency} />
}
