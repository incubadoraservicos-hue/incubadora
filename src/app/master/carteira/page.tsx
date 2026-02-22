'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Briefcase,
    ArrowUpRight,
    ArrowDownLeft,
    Banknote,
    Receipt,
    TrendingUp,
    Filter,
    Download,
    Tags
} from 'lucide-react'
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

export default function MasterWalletPage() {
    const [loading, setLoading] = useState(true)
    const [transactions, setTransactions] = useState<any[]>([])
    const [stats, setStats] = useState({
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        maliBalance: 0
    })
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [transRes, facturasRes, osRes] = await Promise.all([
                supabase.from('transacoes_master').select('*').order('created_at', { ascending: false }),
                supabase.from('facturas').select('*, clientes(nome)').eq('estado', 'paga'),
                supabase.from('ordens_servico').select('*, colaboradores(nome)').eq('estado', 'paga')
            ])

            if (transRes.error) throw transRes.error

            // 1. Map existing transactions
            const manualTrans = (transRes.data || []).map(t => ({
                ...t,
                sub_sistema: (t.categoria?.startsWith('mali_') || t.categoria === 'credito') ? 'mali_mina' : 'geral'
            }))

            // 2. Synthesize transactions from Paid Invoices (Revenue)
            const invoiceTrans = (facturasRes.data || []).map(f => ({
                id: f.id,
                created_at: f.data_pagamento || f.updated_at,
                tipo: 'receita',
                categoria: 'factura',
                descricao: `Recebimento: Factura ${f.numero} (${f.clientes?.nome || 'Cliente'})`,
                valor: f.total,
                sub_sistema: 'geral'
            }))

            // 3. Synthesize transactions from Paid Missions (Expenses/Withdrawals)
            const missionTrans = (osRes.data || []).map(os => ({
                id: os.id,
                created_at: os.data_pagamento || os.updated_at,
                tipo: 'despesa',
                categoria: 'missao',
                descricao: `Saque: Pagamento Missão ${os.numero} (${os.colaboradores?.nome || 'Colaborador'})`,
                valor: os.valor,
                sub_sistema: 'geral'
            }))

            // Combine all and sort by date
            const allTrans = [...manualTrans, ...invoiceTrans, ...missionTrans].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )

            setTransactions(allTrans)

            const statsRec = allTrans.reduce((acc, t) => {
                const val = Number(t.valor) || 0
                if (t.tipo === 'receita') {
                    acc.totalIncome += val
                    if (t.sub_sistema === 'mali_mina') acc.maliIncome += val
                } else {
                    acc.totalExpenses += val
                    if (t.sub_sistema === 'mali_mina') acc.maliExpenses += val
                }
                return acc
            }, { totalIncome: 0, totalExpenses: 0, maliIncome: 0, maliExpenses: 0 })

            setStats({
                totalBalance: statsRec.totalIncome - statsRec.totalExpenses,
                totalIncome: statsRec.totalIncome,
                totalExpenses: statsRec.totalExpenses,
                maliBalance: statsRec.maliIncome - statsRec.maliExpenses
            })

        } catch (error: any) {
            console.error('Erro na carteira:', error)
            toast.error('Erro ao carregar dados financeiros')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Acedendo aos cofres da Incubadora...</div>

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Carteira Master</h2>
                    <p className="text-slate-500">Controlo central de fluxos financeiros (Geral e Mali Ya Mina).</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9">
                        <Download className="mr-2 h-4 w-4" /> Exportar Extrato
                    </Button>
                    <Button size="sm" className="h-9 bg-indigo-600">
                        <Banknote className="mr-2 h-4 w-4" /> Novo Lançamento
                    </Button>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-slate-900 border-none shadow-xl text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Briefcase size={80} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Capital Circulante (Total)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats.totalBalance)}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px]">Saudável</Badge>
                            <span className="text-[10px] text-slate-500">Saldo real consolidado</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-indigo-900 border-none shadow-xl text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Tags size={80} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-300">Saldo Mali Ya Mina</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-indigo-400">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats.maliBalance)}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-indigo-500">Fluxo de créditos e txunas</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Receitas</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats.totalIncome)}
                        </div>
                        <p className="text-[10px] text-emerald-600 mt-1 font-medium">Facturação bruta acumulada</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Despesas</CardTitle>
                        <ArrowDownLeft className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats.totalExpenses)}
                        </div>
                        <p className="text-[10px] text-rose-600 mt-1 font-medium">Pagamentos e custos operacionais</p>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions History */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold">Fluxo de Caixa Centralizado</CardTitle>
                        <CardDescription className="text-xs">Todos os movimentos financeiros do sistema (Geral e Mali).</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                        <Filter className="mr-2 h-3 w-3" /> Filtrar
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-[10px] uppercase">Data / Hora</TableHead>
                                <TableHead className="text-[10px] uppercase">Sistema</TableHead>
                                <TableHead className="text-[10px] uppercase">Categoria</TableHead>
                                <TableHead className="text-[10px] uppercase">Descrição</TableHead>
                                <TableHead className="text-right text-[10px] uppercase">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                                        Nenhuma transação registada.
                                    </TableCell>
                                </TableRow>
                            ) : transactions.map(t => (
                                <TableRow key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="text-xs text-slate-500">
                                        {new Date(t.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {t.sub_sistema === 'mali_mina' ? (
                                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none text-[9px] font-black uppercase">Mali Ya Mina</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[9px] uppercase border-slate-200 text-slate-400">Geral</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize text-[10px] font-bold">
                                            {t.categoria.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-xs font-medium">
                                        {t.descricao}
                                    </TableCell>
                                    <TableCell className={`text-right font-black ${t.tipo === 'despesa' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {t.tipo === 'despesa' ? '-' : '+'}
                                        {new Intl.NumberFormat('pt-MZ').format(t.valor)} MT
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
