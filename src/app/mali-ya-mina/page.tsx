'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles, ArrowLeft, CheckCircle2, ShieldCheck, Wallet, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export default function MaliSubscriptionPage() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        password: ''
    })
    const supabase = createClient()

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        nome: formData.nome,
                        role: 'subscritor'
                    }
                }
            })

            if (authError) throw authError

            // 2. Create Subscritor Profile
            const { error: subError } = await supabase.from('mali_subscritores').insert([{
                user_id: authData.user?.id,
                nome: formData.nome,
                email: formData.email,
                telefone: formData.telefone,
                estado: 'pendente'
            }])

            if (subError) throw subError

            setSuccess(true)
            toast.success('Inscrição enviada com sucesso!')
        } catch (error: any) {
            toast.error('Erro ao subscrever: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="text-emerald-500 w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Inscrição Concluída!</h1>
                <p className="text-slate-400 max-w-md mb-8">
                    A sua solicitação foi enviada para análise. Irá receber um e-mail com as instruções de activação da sua carteira digital em breve.
                </p>
                <Link href="/">
                    <Button variant="outline" className="text-white border-white/10 hover:bg-white/10">
                        Voltar ao Início
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
            {/* Left side: branding/image */}
            <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between overflow-hidden">
                <Image
                    src="/landing.png"
                    alt="Mali Ya Mina"
                    fill
                    className="object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 text-white mb-12">
                        <ArrowLeft size={16} /> <span>Voltar</span>
                    </Link>
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
                        <Sparkles className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-5xl font-black text-white leading-tight mb-6">
                        Liberdade <br />
                        <span className="text-indigo-400 italic">Financeira</span> <br />
                        ao seu alcance.
                    </h1>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-8 max-w-md">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[10px] tracking-widest">
                            <Wallet size={12} /> Carteira Digital
                        </div>
                        <p className="text-xs text-slate-400">Gira o seu capital com taxas de juro competitivas.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-purple-400 font-bold uppercase text-[10px] tracking-widest">
                            <TrendingUp size={12} /> Txuna & Xitique
                        </div>
                        <p className="text-xs text-slate-400">Participe em grupos de poupança comunitária.</p>
                    </div>
                </div>
            </div>

            {/* Right side: form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
                <Card className="w-full max-w-md bg-white border-none shadow-2xl overflow-hidden rounded-3xl">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-2xl font-black text-slate-900">Junte-se ao Mali Ya Mina</CardTitle>
                        <CardDescription>Crie a sua conta de subscritor e comece a prosperar hoje.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4">
                        <form onSubmit={handleSubscribe} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome Completo</Label>
                                <Input
                                    id="nome"
                                    placeholder="Ex: Abdul Pene"
                                    className="h-11 rounded-xl"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="email@exemplo.com"
                                        className="h-11 rounded-xl"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="telefone">Telefone</Label>
                                    <Input
                                        id="telefone"
                                        placeholder="840000000"
                                        className="h-11 rounded-xl"
                                        value={formData.telefone}
                                        onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Palavra-passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    className="h-11 rounded-xl"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="pt-4">
                                <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-lg shadow-indigo-600/20" disabled={loading}>
                                    {loading ? 'Processando...' : 'Subscrever Agora'}
                                </Button>
                            </div>

                            <div className="flex items-center gap-4 py-4 opacity-50">
                                <div className="h-[1px] flex-1 bg-slate-200" />
                                <span className="text-[10px] uppercase font-bold text-slate-400">Garantia Mali</span>
                                <div className="h-[1px] flex-1 bg-slate-200" />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-emerald-600">
                                    <ShieldCheck size={18} />
                                    <span className="text-xs font-medium text-slate-600">Dados encriptados e protegidos por lei.</span>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
