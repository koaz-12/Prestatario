'use client'

import { useState } from 'react'
import { updatePassword } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HandCoins, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            setLoading(false)
            return
        }

        const result = await updatePassword(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setSuccess(true)
            setLoading(false)
            // Redirect after 3 seconds
            setTimeout(() => {
                router.push('/dashboard')
            }, 3000)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-zinc-100">Contraseña actualizada</CardTitle>
                            <CardDescription className="text-zinc-400 mt-1">
                                Tu contraseña ha sido cambiada exitosamente. Serás redirigido en unos segundos...
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Link href="/dashboard">
                            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                                Ir al Dashboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl relative">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <HandCoins className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-zinc-100">Nueva contraseña</CardTitle>
                        <CardDescription className="text-zinc-400 mt-1">
                            Elige una clave segura para tu cuenta
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-300">Nueva contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    required
                                    className="bg-zinc-800/50 border-zinc-700 text-zinc-100 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-zinc-300">Confirmar contraseña</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                required
                                className="bg-zinc-800/50 border-zinc-700 text-zinc-100 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-200"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                'Cambiar contraseña'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
