'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Sparkles, Wallet, Users, HandCoins, Info, CheckCircle2,
    ArrowRight, AlertCircle, Clock, ShieldCheck
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function SubscritorDashboard() {
    const [loading, setLoading] = useState(true)
    const [subscritor, setSubscritor] = useState<any>(null)
    const [wallet, setWallet] = useState<any>(null)
    const [services, setServices] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const [subRes, walletRes] = await Promise.all([
                supabase.from('mali_subscritores').select('*').eq('user_id', user.id).single(),
                supabase.from('carteiras').select('*').eq('user_id', user.id).single()
            ])

            setSubscritor(subRes.data)
            setWallet(walletRes.data)

            // Mock de serviços disponíveis para associação (Txuna, Crédito)
            setServices([
                { id: 'txuna', name: 'Txuna (Xitique)', icon: Users, desc: 'Grupos de poupança mútua rotativos.', color: 'text-purple-600', active: true },
                { id: 'credito', name: 'Crédito Mali', icon: HandCoins, desc: 'Empréstimos rápidos com taxas Mali.', color: 'text-indigo-600', active: true },
                { id: 'invest', name: 'Ku Humelela', icon: Sparkles, desc: 'Fundo de investimento com retorno mensal.', color: 'text-pink-600', active: false },
            ])

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">A carregar o seu universo financeiro...</div>

    if (subscritor?.estado === 'pendente') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-6">
                <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100">
                    <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-slate-900">Inscrição Pendente</h2>
                    <p className="text-slate-500 font-medium mt-2 leading-relaxed">
                        A sua solicitação para integrar o ecossistema Mali Ya Mina está a ser analisada pelo Master. Receberá uma notificação em breve.
                    </p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>Verificar Novamente</Button>
            </div>
        )
    }

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Kanimambo, {subscritor?.nome.split(' ')[0]}!</h1>
                    <p className="text-slate-500 font-medium tracking-tight">Bem-vindo à nova era da sua economia pessoal.</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-6">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldo Disponível</p>
                        <p className="text-2xl font-black text-indigo-600">{new Intl.NumberFormat('pt-MZ').format(wallet?.saldo_disponivel || 0)} MT</p>
                    </div>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 font-bold rounded-xl shadow-lg shadow-indigo-100">Depositar</Button>
                </div>
            </div>

            {/* CTA: Associate with Services */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="text-indigo-600" />
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Serviços Disponíveis</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {services.map((service) => (
                        <Card key={service.id} className="border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white">
                            <CardHeader className="pb-2">
                                <div className={`p-3 rounded-2xl w-fit ${service.color.replace('text', 'bg')}/10 ${service.color}`}>
                                    <service.icon size={24} />
                                </div>
                                <CardTitle className="text-lg font-black mt-4">{service.name}</CardTitle>
                                <CardDescription className="text-xs font-medium leading-relaxed">{service.desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {service.active ? (
                                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-xl group-hover:gap-3 transition-all">
                                        Associar-me Agora <ArrowRight size={18} />
                                    </Button>
                                ) : (
                                    <Badge variant="outline" className="w-full justify-center h-11 text-slate-400 border-slate-100 uppercase font-black tracking-widest">Brevemente</Badge>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Security/Info */}
            <div className="p-8 rounded-3xl bg-indigo-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Sparkles size={120} />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <h3 className="text-2xl font-black mb-4">Porquê Mali Ya Mina?</h3>
                    <p className="text-indigo-200 font-medium leading-relaxed mb-6">
                        O nosso objectivo é democratizar o acesso ao financiamento e fomentar a poupança comunitária. Através da tecnologia, trazemos o tradicional "Xitique" para o mundo digital com segurança e transparência.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase">
                            <CheckCircle2 size={14} className="text-emerald-400" /> Capital Protegido
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase">
                            <CheckCircle2 size={14} className="text-emerald-400" /> Taxas Justas
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase">
                            <CheckCircle2 size={14} className="text-emerald-400" /> Gestão Comunitária
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
