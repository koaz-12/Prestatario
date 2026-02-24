import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Loan, Contact, LoanPayment, Profile } from '@/lib/types'

interface PrestatarioDB extends DBSchema {
    loans: {
        key: string
        value: Loan & { contact?: Contact | null }
        indexes: { 'by-status': string; 'by-user': string }
    }
    contacts: {
        key: string
        value: Contact
        indexes: { 'by-user': string }
    }
    payments: {
        key: string
        value: LoanPayment
        indexes: { 'by-loan': string }
    }
    profile: {
        key: string
        value: Profile
    }
    queue: {
        key: number
        value: {
            id?: number
            type: 'CREATE_LOAN' | 'ADD_PAYMENT' | 'UPDATE_PROFILE'
            payload: any
            createdAt: string
        }
        autoIncrement: true
    }
}

let db: IDBPDatabase<PrestatarioDB> | null = null

export async function getDB() {
    if (db) return db
    db = await openDB<PrestatarioDB>('prestatario-db', 1, {
        upgrade(database) {
            // Loans store
            const loansStore = database.createObjectStore('loans', { keyPath: 'id' })
            loansStore.createIndex('by-status', 'status')
            loansStore.createIndex('by-user', 'user_id')

            // Contacts store
            const contactsStore = database.createObjectStore('contacts', { keyPath: 'id' })
            contactsStore.createIndex('by-user', 'user_id')

            // Payments store
            const paymentsStore = database.createObjectStore('payments', { keyPath: 'id' })
            paymentsStore.createIndex('by-loan', 'loan_id')

            // Profile store
            database.createObjectStore('profile', { keyPath: 'id' })

            // Queue store for offline ops
            database.createObjectStore('queue', { keyPath: 'id', autoIncrement: true })
        },
    })
    return db
}

// ===================== LOANS =====================
export async function cacheLoans(loans: (Loan & { contact?: Contact | null })[]) {
    const database = await getDB()
    const tx = database.transaction('loans', 'readwrite')
    await Promise.all(loans.map(loan => tx.store.put(loan)))
    await tx.done
}

export async function getCachedLoans(): Promise<(Loan & { contact?: Contact | null })[]> {
    const database = await getDB()
    return database.getAll('loans')
}

// ===================== CONTACTS =====================
export async function cacheContacts(contacts: Contact[]) {
    const database = await getDB()
    const tx = database.transaction('contacts', 'readwrite')
    await Promise.all(contacts.map(c => tx.store.put(c)))
    await tx.done
}

export async function getCachedContacts(): Promise<Contact[]> {
    const database = await getDB()
    return database.getAll('contacts')
}

// ===================== PAYMENTS =====================
export async function cachePayments(payments: LoanPayment[]) {
    const database = await getDB()
    const tx = database.transaction('payments', 'readwrite')
    await Promise.all(payments.map(p => tx.store.put(p)))
    await tx.done
}

export async function getCachedPaymentsByLoan(loanId: string): Promise<LoanPayment[]> {
    const database = await getDB()
    return database.getAllFromIndex('payments', 'by-loan', loanId)
}

// ===================== PROFILE =====================
export async function cacheProfile(profile: Profile) {
    const database = await getDB()
    await database.put('profile', profile)
}

export async function getCachedProfile(): Promise<Profile | undefined> {
    const database = await getDB()
    const all = await database.getAll('profile')
    return all[0]
}

// ===================== QUEUE =====================
export async function enqueue(operation: { type: 'CREATE_LOAN' | 'ADD_PAYMENT' | 'UPDATE_PROFILE'; payload: any }) {
    const database = await getDB()
    await database.add('queue', {
        ...operation,
        createdAt: new Date().toISOString()
    })
}

export async function getQueue() {
    const database = await getDB()
    return database.getAll('queue')
}

export async function clearQueueItem(id: number) {
    const database = await getDB()
    await database.delete('queue', id)
}
