'use client'

import { useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/auth/actions'
import { TopHeader } from '@/components/navigation/TopHeader'
import { LogOut, User, Mail, Shield, Loader2, HandCoins, DollarSign } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateCurrency } from '@/app/actions/profile'
import { useRouter } from 'next/navigation'

interface ProfileClientProps {
    user: SupabaseUser | null
    profile: Profile | null
}

export function ProfileClient({ user, profile }: ProfileClientProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    function handleSignOut() {
        startTransition(async () => {
            await signOut()
        })
    }

    function handleCurrencyChange(val: string) {
        startTransition(async () => {
            await updateCurrency(val)
            router.refresh()
        })
    }

    return (
        <div>
            <TopHeader title="Perfil" subtitle="Tu cuenta" />
            <div className="px-4 space-y-6">

                {/* Avatar + Name */}
                <div className="flex flex-col items-center py-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                        <User className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-100">
                        {user?.user_metadata?.full_name || 'Usuario'}
                    </h2>
                    <p className="text-zinc-500 text-sm">{user?.email}</p>
                </div>

                {/* Info Cards */}
                <div className="space-y-3">
                    <Card className="p-4 border-zinc-800 bg-zinc-900/60 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Correo electrónico</p>
                            <p className="text-sm text-zinc-200">{user?.email}</p>
                        </div>
                    </Card>

                    <Card className="p-4 border-zinc-800 bg-zinc-900/60 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">ID de usuario</p>
                            <p className="text-sm text-zinc-200 font-mono truncate max-w-[200px]">{user?.id}</p>
                        </div>
                    </Card>

                    {/* Divisa */}
                    <Card className="p-4 border-zinc-800 bg-zinc-900/60 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-zinc-500 mb-1">Divisa principal</p>
                            <Select
                                defaultValue={profile?.currency || 'DOP'}
                                onValueChange={handleCurrencyChange}
                                disabled={isPending}
                            >
                                <SelectTrigger className="h-8 w-full bg-zinc-800/80 border-zinc-700 text-zinc-100 rounded-lg">
                                    <SelectValue placeholder="Moneda" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 rounded-xl">
                                    <SelectItem value="DOP">DOP - Peso Dominicano</SelectItem>
                                    <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                                    <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                                    <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </Card>

                    <Card className="p-4 border-zinc-800 bg-zinc-900/60 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <HandCoins className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">App</p>
                            <p className="text-sm text-zinc-200">Prestatario v1.0</p>
                        </div>
                    </Card>
                </div>

                {/* Sign Out */}
                <Button
                    onClick={handleSignOut}
                    disabled={isPending}
                    variant="outline"
                    className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-12"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <LogOut className="w-4 h-4 mr-2" />
                    )}
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    )
}
