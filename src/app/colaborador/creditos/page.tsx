'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HandCoins, Info, CheckCircle2, AlertTriangle, Clock, Ban, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'

export default function CreditosPage() {
    const [loading, setLoading] = useState(true)
    const [solicitando, setSolicitando] = useState(false)
    const [stats, setStats] = useState({ availableWallet: 0, maxAllowed: 0, minRequired: 0, juros: 0.10 })
    const [userStatus, setUserStatus] = useState('activo')
    const [creditos, setCreditos] = useState<any[]>([])
    const [valorSolicitado, setValorSolicitado] = useState('')
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Get Config, Wallet and User Status
            const [empRes, walletRes, colabRes] = await Promise.all([
                supabase.from('empresas').select('config_financeira').single(),
                supabase.from('carteiras').select('saldo_disponivel').eq('user_id', user.id).single(),
                supabase.from('colaboradores').select('estado').eq('user_id', user.id).single()
            ])

            const config = empRes.data?.config_financeira || {}
            setUserStatus(colabRes.data?.estado || 'activo')

            setStats({
                availableWallet: walletRes.data?.saldo_disponivel || 0,
                maxAllowed: config.credito_max_colaborador || 5000,
                minRequired: config.saldo_min_colaborador || 1000,
                juros: config.juros_credito_colab || 0.10
            })

            // 2. Get Credits history
            const { data: creditsData } = await supabase
                .from('creditos')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            setCreditos(creditsData || [])

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSolicitar = async (e: React.FormEvent) => {
        e.preventDefault()
        const valor = parseFloat(valorSolicitado)

        if (userStatus === 'bloqueado') return toast.error('A sua conta está bloqueada para novas solicitações.')
        if (isNaN(valor) || valor <= 0) return toast.error('Insira um valor válido')
        if (valor > stats.maxAllowed) return toast.error(`O valor máximo permitido é ${stats.maxAllowed} MZN`)
        if (stats.availableWallet < stats.minRequired) return toast.error(`Precisa de um saldo mínimo de ${stats.minRequired} MZN para solicitar crédito`)

        setSolicitando(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase.from('creditos').insert([{
                user_id: user?.id,
                valor_solicitado: valor,
                taxa_juros: stats.juros,
                estado: 'pendente'
            }])

            if (error) throw error
            toast.success('Solicitação enviada ao sistema Mali Ya Mina!')
            setValorSolicitado('')
            fetchData()
        } catch (error: any) {
            toast.error('Erro ao solicitar: ' + error.message)
        } finally {
            setSolicitando(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">A consultar o hub financeiro Mali...</div>

    const canRequest = stats.availableWallet >= stats.minRequired && userStatus !== 'bloqueado'

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg">
                        <HandCoins size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">Crédito <span className="text-indigo-600">Mali</span></h2>
                        <p className="text-slate-500 font-medium tracking-tight">Serviço exclusivo de financiamento para colaboradores Incubadora.</p>
                    </div>
                </div>
                {userStatus === 'bloqueado' && (
                    <Badge variant="destructive" className="h-10 px-4 text-xs font-black uppercase tracking-widest gap-2">
                        <Ban size={14} /> Conta Bloqueada
                    </Badge>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Request Form */}
                <Card className="md:col-span-2 border-none shadow-sm overflow-hidden bg-white">
                    <CardHeader className="bg-indigo-50/50 border-b">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-900">
                            Protocolo de Solicitação
                        </CardTitle>
                        <CardDescription className="font-medium text-[11px]">O desembolso será processado via Bancada Mali Ya Mina.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {!canRequest ? (
                            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-4">
                                <AlertTriangle className="h-6 w-6 text-rose-600 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-rose-900 uppercase">Elegibilidade Restrita</p>
                                    <p className="text-xs text-rose-700 font-medium leading-relaxed">
                                        {userStatus === 'bloqueado'
                                            ? 'A sua conta foi bloqueada por decisão administrativa. Contacte o Master para regularizar.'
                                            : `Para solicitar crédito, a sua carteira deve ter no mínimo ${new Intl.NumberFormat('pt-MZ').format(stats.minRequired)} MT de saldo disponível.`
                                        }
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSolicitar} className="space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="valor" className="font-bold text-xs text-slate-500 uppercase tracking-wider">Montante Desejado (MZN)</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">MT</span>
                                        <Input
                                            id="valor"
                                            type="number"
                                            placeholder="0.00"
                                            className="pl-12 h-14 text-xl font-black border-slate-100 bg-slate-50 focus:bg-white rounded-xl"
                                            value={valorSolicitado}
                                            onChange={(e) => setValorSolicitado(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                        Limite para o seu nível: <span className="text-indigo-600">{new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats.maxAllowed)}</span>
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                                    <div className="flex justify-between text-[11px] font-black text-indigo-700 uppercase">
                                        <span>Taxa Mali Colaborador</span>
                                        <span>{(stats.juros * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-[1px] bg-indigo-100 w-full" />
                                    <div className="flex justify-between text-base font-black text-indigo-900 pt-1">
                                        <span className="tracking-tight">Total c/ Juros</span>
                                        <span>
                                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(parseFloat(valorSolicitado || '0') * (1 + stats.juros))}
                                        </span>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-xl shadow-xl shadow-indigo-100" disabled={solicitando}>
                                    {solicitando ? 'Protocolando...' : 'Confirmar Solicitação Mali'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="border-none shadow-sm bg-slate-900 text-white rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <ShieldCheck size={120} />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-lg font-black flex items-center gap-2">
                            <Info className="h-5 w-5 text-indigo-400" />
                            Regulamento Mali
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-black text-xs">01</div>
                            <p className="text-xs font-medium text-slate-400 leading-relaxed">
                                O crédito Mali é um serviço independente da Incubadora Serviços.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-black text-xs">02</div>
                            <p className="text-xs font-medium text-slate-400 leading-relaxed">
                                A liquidação é feita via desconto no saldo da sua carteira digital.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-black text-xs">03</div>
                            <p className="text-xs font-medium text-slate-400 leading-relaxed">
                                Colaboradores têm acesso a taxas preferenciais e aprovação rápida.
                            </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-white/5">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                <ShieldCheck className="text-emerald-500 h-5 w-5" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-300">Hub Mali Verificado</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* History */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-black">Ciclos de Financiamento</CardTitle>
                        <CardDescription className="text-xs font-medium">Histórico de créditos Mali solicitados pela sua conta.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/30">
                            <TableRow>
                                <TableHead className="text-[10px] uppercase font-bold tracking-wider">Início do Ciclo</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold tracking-wider">Balanço</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold tracking-wider">Juros Aplicados</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold tracking-wider">Liquidação Total</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold tracking-wider">Status Mali</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {creditos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <HandCoins size={40} />
                                            <span className="text-sm font-black uppercase">Sem Actividade Mali</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : creditos.map(c => (
                                <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="text-xs font-medium text-slate-500">
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="font-black text-slate-900">
                                        {new Intl.NumberFormat('pt-MZ').format(c.valor_solicitado)} MT
                                    </TableCell>
                                    <TableCell className="text-xs font-black text-indigo-600">
                                        {(c.taxa_juros * 100).toFixed(0)}%
                                    </TableCell>
                                    <TableCell className="font-black text-indigo-900">
                                        {new Intl.NumberFormat('pt-MZ').format(c.valor_solicitado * (1 + c.taxa_juros))} MT
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`text-[9px] font-black uppercase border-none px-2 py-0.5 ${c.estado === 'aprovado' ? 'bg-emerald-100 text-emerald-700' :
                                            c.estado === 'pendente' ? 'bg-amber-100 text-amber-700' :
                                                c.estado === 'pago' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {c.estado}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
