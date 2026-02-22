'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    FileText,
    Users,
    ClipboardList,
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Tags
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
    const supabase = createClient()
    const [stats, setStats] = useState({
        totalReceber: 0,
        clientesActivos: 0,
        osExecucao: 0,
        saldoTotal: 0,
        saldoMali: 0,
        receitaMes: 0,
        despesaMes: 0
    })
    const [recentTrans, setRecentTrans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()

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
        setLoading(true)
        try {
            const [facturasRes, osRes, transRes, clientesRes] = await Promise.all([
                supabase.from('facturas').select('id, total, estado, data_pagamento'),
                supabase.from('ordens_servico').select('id, valor, estado, data_pagamento'),
                supabase.from('transacoes_master').select('*').order('created_at', { ascending: false }),
                supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('estado', 'activo')
            ])

            const facturas = facturasRes.data || []
            const misses = osRes.data || []
            const transactions = transRes.data || []
            const clientesCount = clientesRes.count || 0

            // 1. Receitas (Facturas Pagas) e Pendentes (Facturas por Pagar)
            const pagamentosPendentes = facturas.filter(f => f.estado !== 'paga').reduce((acc, f) => acc + (Number(f.total) || 0), 0)
            const receitaTotal = facturas.filter(f => f.estado === 'paga').reduce((acc, f) => acc + (Number(f.total) || 0), 0)

            // 2. Despesas (Missões Pagas) e Pendentes (Missões por Pagar)
            const despesasPendentes = misses.filter(os => os.estado !== 'paga').reduce((acc, os) => acc + (Number(os.valor) || 0), 0)
            const despesaSubtotal = misses.filter(os => os.estado === 'paga').reduce((acc, os) => acc + (Number(os.valor) || 0), 0)

            // 3. Stats Mensais
            const firstDayMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            const recMes = facturas
                .filter(f => f.estado === 'paga' && f.data_pagamento && new Date(f.data_pagamento) >= firstDayMonth)
                .reduce((acc, f) => acc + (Number(f.total) || 0), 0)
            const desMes = misses
                .filter(os => os.estado === 'paga' && os.data_pagamento && new Date(os.data_pagamento) >= firstDayMonth)
                .reduce((acc, os) => acc + (Number(os.valor) || 0), 0)

            // 4. Saldo em Caixa (Receita Real - Despesa Real)
            const totalSaldo = receitaTotal - despesaSubtotal

            // 5. Recent Transactions fallback to OS/Invoices if table is empty
            let formattedTrans = transactions.map(t => ({ ...t, isMali: t.categoria?.startsWith('mali_') }))

            if (formattedTrans.length === 0) {
                // If transactions table is still being populated, show recent paid items
                const recentInvoices = facturas.filter(f => f.estado === 'paga').slice(0, 3).map(f => ({
                    id: f.id,
                    descricao: `Recebimento Factura`,
                    valor: f.total,
                    tipo: 'receita',
                    created_at: f.data_pagamento,
                    isMali: false
                }))
                const recentMissions = misses.filter(os => os.estado === 'paga').slice(0, 3).map(os => ({
                    id: os.id,
                    descricao: `Pagamento Missão`,
                    valor: os.valor,
                    tipo: 'despesa',
                    created_at: os.data_pagamento,
                    isMali: false
                }))
                formattedTrans = [...recentInvoices, ...recentMissions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            }

            const maliSaldo = formattedTrans.filter(t => t.isMali).reduce((acc, t) => acc + (t.tipo === 'receita' ? t.valor : -t.valor), 0)

            setStats({
                totalReceber: pagamentosPendentes,
                clientesActivos: clientesCount,
                osExecucao: despesasPendentes,
                saldoTotal: totalSaldo,
                saldoMali: maliSaldo,
                receitaMes: recMes,
                despesaMes: desMes
            })

            setRecentTrans(formattedTrans.slice(0, 6))
        } catch (error) {
            console.error('Erro no dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const cards = [
        { label: 'Saldo em Caixa', value: stats.saldoTotal, icon: Wallet, color: 'text-slate-900', bg: 'bg-slate-100', isMoney: true },
        { label: 'Pagamentos Pendentes (Facturas)', value: stats.totalReceber, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', isMoney: true },
        { label: 'Capital Mali Ya Mina', value: stats.saldoMali, icon: Tags, color: 'text-indigo-600', bg: 'bg-indigo-50', isMoney: true },
        { label: 'Despesas Pendentes (Missões)', value: stats.osExecucao, icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50', isMoney: true },
    ]

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Financeiro</h2>
                    <p className="text-slate-500 font-medium">Controlo consolidado: Hub Geral e Ecossistema Mali.</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black text-slate-400">Entradas (Mes)</span>
                        <span className="text-xl font-black text-emerald-600">+{new Intl.NumberFormat('pt-MZ').format(stats.receitaMes)} MT</span>
                    </div>
                    <div className="w-[1px] bg-slate-100" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black text-slate-400">Saídas (Mes)</span>
                        <span className="text-xl font-black text-rose-600">-{new Intl.NumberFormat('pt-MZ').format(stats.despesaMes)} MT</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <Card key={card.label} className="border-none shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] uppercase font-black text-slate-500 tracking-wider">{card.label}</CardTitle>
                            <div className={`${card.bg} ${card.color} rounded-xl p-2.5`}>
                                <card.icon size={18} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-black ${card.label.includes('Mina') ? 'text-indigo-600' : 'text-slate-900'}`}>
                                {card.isMoney ? new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(card.value) : card.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold">Fluxo de Caixa Consolidado</CardTitle>
                            <CardDescription className="text-xs">Últimos movimentos de todos os subsistemas.</CardDescription>
                        </div>
                        <TrendingUp className="text-slate-300 h-5 w-5" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {recentTrans.length === 0 ? (
                                <div className="flex items-center justify-center h-60 text-slate-400 italic text-sm">
                                    Nenhuma transação registada no novo sistema.
                                </div>
                            ) : (
                                recentTrans.map((t, idx) => (
                                    <div key={`${t.id}-${idx}`} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-xl ${t.tipo === 'receita' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {t.tipo === 'receita' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-slate-900">{t.descricao}</p>
                                                    {t.isMali && <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none text-[8px] font-black uppercase">Mali</Badge>}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium">{(t.categoria || 'geral').replace('_', ' ')} • {new Date(t.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-black ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {t.tipo === 'receita' ? '+' : '-'} {new Intl.NumberFormat('pt-MZ').format(t.valor)} MT
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Resumo de Saúde</CardTitle>
                        <CardDescription className="text-xs">Eficiência financeira actual.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-bold uppercase text-slate-500">
                                <span>Equilíbrio Hub vs Mali</span>
                                <span className="text-indigo-600">{stats.saldoTotal > 0 ? ((stats.saldoMali / stats.saldoTotal) * 100).toFixed(0) : 0}% Mali</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-1000"
                                    style={{ width: `${stats.saldoTotal > 0 ? (stats.saldoMali / stats.saldoTotal) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Previsão Próximos 30d</p>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500">A Receber</p>
                                    <p className="text-lg font-black">+{new Intl.NumberFormat('pt-MZ').format(stats.totalReceber)} MT</p>
                                </div>
                                <div className="h-8 w-[1px] bg-slate-800" />
                                <div className="space-y-1 text-right">
                                    <p className="text-xs text-slate-500">Estado</p>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px]">Positivo</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 space-y-3">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                O capital Mali representa a liquidez do ecossistema.
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                {stats.clientesActivos} clientes activos gerando facturação recorrente.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
