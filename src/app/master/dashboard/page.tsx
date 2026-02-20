'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    FileText,
    Users,
    ClipboardList,
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react'

export default function DashboardPage() {
    const supabase = createClient()
    const [stats, setStats] = useState({
        totalReceber: 0,
        clientesActivos: 0,
        osExecucao: 0,
        saldoDisponivel: 0,
        receitaMes: 0,
        despesaMes: 0
    })
    const [recentTrans, setRecentTrans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()

        // Sincronização em Tempo Real (Dashboard Vivo)
        const channel = supabase
            .channel('dashboard-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes_master' }, () => fetchDashboardData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'facturas' }, () => fetchDashboardData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ordens_servico' }, () => fetchDashboardData())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchDashboardData = async () => {
        // Obter data de referência para o mês actual
        const now = new Date()
        const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const [facturas, clientes, os] = await Promise.all([
            supabase.from('facturas').select('total, estado, numero, data_pagamento'),
            supabase.from('clientes').select('id').eq('estado', 'activo'),
            supabase.from('ordens_servico').select('id, estado, valor_colaborador, numero, data_pagamento').eq('estado', 'em_execucao')
        ])

        // 1. Buscar transacções reais (Pagos)
        const { data: facturasPagas } = await supabase.from('facturas').select('*').eq('estado', 'paga')
        const { data: osPagas } = await supabase.from('ordens_servico').select('*').eq('estado', 'paga')

        const receitas = facturasPagas || []
        const despesas = osPagas || []

        // 2. Calcular Estatísticas
        const totalReceber = facturas.data?.filter(f => f.estado !== 'paga').reduce((acc, f) => acc + f.total, 0) || 0
        const osEmCurso = os.data?.length || 0

        // 3. Calcular Saldo e Fluxo Mensal
        let totalSaldo = 0
        let recMes = 0
        let desMes = 0

        receitas.forEach(f => {
            totalSaldo += f.total
            if (f.data_pagamento && f.data_pagamento >= firstDayMonth) recMes += f.total
        })

        despesas.forEach(o => {
            totalSaldo -= o.valor_colaborador
            if (o.data_pagamento && o.data_pagamento >= firstDayMonth) desMes += o.valor_colaborador
        })

        // 4. Construir Histórico Recente (Mesclar os dois)
        const histReceitas = receitas.map(f => ({
            id: f.id,
            tipo: 'receita',
            descricao: `Factura ${f.numero}`,
            data_transacao: f.data_pagamento,
            valor: f.total
        }))

        const histDespesas = despesas.map(o => ({
            id: o.id,
            tipo: 'despesa',
            descricao: `Pagamento OS-${o.numero}`,
            data_transacao: o.data_pagamento,
            valor: o.valor_colaborador
        }))

        const totalRecent = [...histReceitas, ...histDespesas]
            .sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime())
            .slice(0, 5)

        setStats({
            totalReceber,
            clientesActivos: clientes.data?.length || 0,
            osExecucao: osEmCurso,
            saldoDisponivel: totalSaldo,
            receitaMes: recMes,
            despesaMes: desMes
        })
        setRecentTrans(totalRecent)
        setLoading(false)
    }

    const cards = [
        { label: 'Saldo em Caixa', value: stats.saldoDisponivel, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50', isMoney: true },
        { label: 'A Receber (Facturas)', value: stats.totalReceber, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', isMoney: true },
        { label: 'Clientes Activos', value: stats.clientesActivos, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Missões em Curso', value: stats.osExecucao, icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
    ]

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-slate-500">Resumo financeiro e operacional da Incubadora.</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border flex gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Receita (Mês)</span>
                        <span className="text-lg font-bold text-emerald-600">+{stats.receitaMes.toLocaleString()} MT</span>
                    </div>
                    <div className="w-[1px] bg-slate-100" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Saídas (Mês)</span>
                        <span className="text-lg font-bold text-red-600">-{stats.despesaMes.toLocaleString()} MT</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <Card key={card.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                            <div className={`${card.bg} ${card.color} rounded-full p-2`}>
                                <card.icon size={16} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {card.isMoney ? new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(card.value) : card.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Fluxo de Caixa Recente</CardTitle>
                        <TrendingUp className="text-slate-300 h-5 w-5" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentTrans.length === 0 ? (
                                <div className="flex items-center justify-center h-40 text-slate-400 italic">
                                    Nenhuma transacção financeira registada.
                                </div>
                            ) : (
                                recentTrans.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${t.tipo === 'receita' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                {t.tipo === 'receita' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{t.descricao}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(t.data_transacao).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {t.tipo === 'receita' ? '+' : '-'} {Number(t.valor).toLocaleString()} MT
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Resumo de Saúde</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Margem de Lucro</span>
                                <span className="font-bold">68%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[68%]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Eficiência de Pagamento</span>
                                <span className="font-bold">82%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[82%]" />
                            </div>
                        </div>
                        <div className="pt-4 border-t space-y-3">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                Lucro acumulado este ano: 120.450 MT
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                Previsão de recebimento: +45.000 MT
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
