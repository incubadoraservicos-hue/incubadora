'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import Image from 'next/image'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            const role = data.user?.user_metadata?.role

            if (role === 'master' || data.user?.email === 'incubadoraservicos@gmail.com') {
                router.push('/master/dashboard')
            } else {
                router.push('/colaborador/minhas-os')
            }

            toast.success('Sessão iniciada com sucesso!')
        } catch (error: any) {
            toast.error(error.message || 'Erro ao iniciar sessão')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center p-4 bg-slate-100">
            <Card className="z-10 w-full max-w-md border-none shadow-2xl bg-white shadow-indigo-200/50">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <div className="relative h-20 w-56">
                            <Image
                                src="/logo.png"
                                alt="Incubadora de Soluções"
                                fill
                                sizes="(max-width: 768px) 100vw, 224px"
                                className="object-contain"
                                unoptimized
                                priority
                            />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Acesso à Plataforma</CardTitle>
                        <CardDescription className="text-slate-500">
                            Gestão Empresarial & Soluções Digitais
                        </CardDescription>
                    </div>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-slate-700">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nome@exemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white border-slate-200 focus:border-indigo-500"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Palavra-passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-white border-slate-200"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 h-11" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar no Sistema
                        </Button>
                        <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest">
                            © {new Date().getFullYear()} Incubadora de Soluções
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div >
    )
}
