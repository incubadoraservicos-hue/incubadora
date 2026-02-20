'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, History, ArrowDownToLine, TrendingUp, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function ColaboradorSaldoPage() {
    const [colab, setColab] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saldoPendente, setSaldoPendente] = useState(0)
    const [saldoRecebido, setSaldoRecebido] = useState(0)
    const [pagamentos, setPagamentos] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user

            if (!user) {
                toast.error('Sessão expirada. Faça login novamente.')
                setLoading(false)
                return
            }

            // 1. Encontrar o colaborador por Email ou User ID
            const { data: colabData } = await supabase
                .from('colaboradores')
                .select('*')
                .or(`email.eq.${user.email},user_id.eq.${user.id}`)
                .maybeSingle()

            if (!colabData) {
                console.error('Perfil não encontrado para:', user.email)
                setLoading(false)
                return
            }

            setColab(colabData)

            // 2. Buscar TODAS as missões (OS) ligadas ao colaborador
            const { data: missoes, error: osError } = await supabase
                .from('ordens_servico')
                .select('*')
                .eq('colaborador_id', colabData.id)
                .order('created_at', { ascending: false })

            if (osError) throw osError

            if (missoes) {
                // SALDO PENDENTE: Missões Concluídas à espera de pagamento
                const pendente = missoes
                    .filter(m => m.estado === 'concluida')
                    .reduce((acc, curr) => acc + (Number(curr.valor_colaborador) || 0), 0)

                // SALDO RECEBIDO: Missões que já foram marcadas como PAGAS
                const recebido = missoes
                    .filter(m => m.estado === 'paga')
                    .reduce((acc, curr) => acc + (Number(curr.valor_colaborador) || 0), 0)

                // HISTÓRICO: Apenas as missões pagas
                const historicoPagamentos = missoes.filter(m => m.estado === 'paga')

                setSaldoPendente(pendente)
                setSaldoRecebido(recebido)
                setPagamentos(historicoPagamentos)
            }
        } catch (error: any) {
            toast.error('Erro ao actualizar saldo: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#002B5B]">Meu Saldo</h2>
                    <p className="text-slate-500">Gestão de ganhos e histórico de liquidações.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} className="w-fit">
                    Actualizar Dados
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* DESTAQUE PRINCIPAL: SALDO JÁ RECEBIDO */}
                <Card className="border-none shadow-md bg-emerald-600 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp size={80} />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-xs uppercase tracking-widest font-bold opacity-80">Saldo Liquidado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black">
                            {formatCurrency(saldoRecebido)}
                        </div>
                        <p className="text-[10px] mt-2 opacity-70">Total de valores já transferidos para a sua conta.</p>
                    </CardContent>
                </Card>

                {/* SALDO EM TRÂNSITO / PENDENTE */}
                <Card className="border-none shadow-sm bg-white border-l-4 border-l-amber-400">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase tracking-widest font-bold text-slate-400 font-medium">A Receber (Em Trânsito)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">
                            {formatCurrency(saldoPendente)}
                        </div>
                        <div className="flex items-center text-[10px] text-amber-600 mt-1 font-bold">
                            <History size={10} className="mr-1" /> Aguardando liquidação pelo Master
                        </div>
                    </CardContent>
                </Card>

                {/* GANHOS TOTAIS */}
                <Card className="border-none shadow-sm bg-slate-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase tracking-widest font-bold text-slate-400">Ganhos Acumulados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-400 italic">
                            {formatCurrency(saldoRecebido + saldoPendente)}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Soma total de serviços realizados.</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <div className="px-6 py-4 border-b bg-slate-50/30 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Wallet size={18} className="text-indigo-600" /> Histórico de Pagamentos Recebidos
                    </h3>
                    <Badge variant="outline" className="bg-white">{pagamentos.length} Registos</Badge>
                </div>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-20 text-center text-slate-400 italic">Carregando histórico...</div>
                    ) : pagamentos.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                            <div className="bg-slate-50 p-4 rounded-full mb-3 opacity-50">
                                <History size={32} />
                            </div>
                            <p className="text-sm">Ainda não existem pagamentos liquidados para mostrar.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-bold">
                                    <tr>
                                        <th className="px-6 py-4">ID Transacção</th>
                                        <th className="px-6 py-4">Data de Liquidação</th>
                                        <th className="px-6 py-4">Valor Pago</th>
                                        <th className="px-6 py-4 text-right">Estado no Banco</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {pagamentos.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono font-bold text-indigo-600 group-hover:underline">OS-{p.numero}</span>
                                                    <span className="text-[9px] text-slate-400 uppercase tracking-tighter">Referência Interna</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Em processamento'}
                                            </td>
                                            <td className="px-6 py-4 font-black text-slate-800">
                                                {formatCurrency(p.valor_colaborador)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                                                    <CheckCircle2 size={12} /> Liquidado
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
