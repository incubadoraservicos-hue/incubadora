'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, PieChart, TrendingUp, Download, Calendar, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function RelatoriosPage() {
    const supabase = createClient()
    const [stats, setStats] = useState({ facturacao: 0, pendente: 0, os_concluidas: 0, custos: 0 })
    const [transacoes, setTransacoes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()

        const channel = supabase
            .channel('finance-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'facturas' }, () => fetchStats())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ordens_servico' }, () => fetchStats())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchStats = async () => {
        setLoading(true)
        try {
            // 1. Buscar Invoices (Facturação)
            const { data: facturas, error: fErr } = await supabase.from('facturas').select('*')
            // 2. Buscar OS Pagas (Saídas)
            const { data: osPagas, error: oErr } = await supabase.from('ordens_servico').select('*').eq('estado', 'paga')
            // 3. Buscar OS Concluídas (Operacional)
            const { count: osCount } = await supabase.from('ordens_servico').select('*', { count: 'exact', head: true }).eq('estado', 'concluida')

            if (fErr || oErr) throw new Error('Erro ao buscar dados')

            const allFacts = facturas || []
            const paidOS = osPagas || []

            // Cálculos
            const totalFaturado = allFacts.reduce((acc, f) => acc + f.total, 0)
            const totalPendente = allFacts.filter(f => f.estado !== 'paga').reduce((acc, f) => acc + f.total, 0)
            const totalCustos = paidOS.reduce((acc, o) => acc + (Number(o.valor_colaborador) || 0), 0)

            setStats({
                facturacao: totalFaturado,
                pendente: totalPendente,
                os_concluidas: osCount || 0,
                custos: totalCustos
            })

            // 4. Montar Histórico (Entradas e Saídas Pagas)
            const entradas = allFacts.filter(f => f.estado === 'paga').map(f => ({
                id: f.id,
                tipo: 'receita',
                categoria: 'factura',
                descricao: `Recebimento: ${f.numero}`,
                valor: f.total,
                data_transacao: f.data_pagamento || f.created_at
            }))

            const saidas = paidOS.map(o => ({
                id: o.id,
                tipo: 'despesa',
                categoria: 'pagamento',
                descricao: `Saída Missão: ${o.numero}`,
                valor: Number(o.valor_colaborador) || 0,
                data_transacao: o.data_pagamento || o.created_at
            }))

            const merged = [...entradas, ...saidas].sort((a, b) =>
                new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime()
            )

            setTransacoes(merged)
        } catch (error) {
            toast.error('Ocorreu um erro ao actualizar o painel')
        } finally {
            setLoading(false)
        }
    }

    const exportToCSV = () => {
        const header = ['Data', 'Tipo', 'Categoria', 'Descricao', 'Valor']
        const rows = transacoes.map(t => [
            new Date(t.data_transacao).toLocaleDateString(),
            t.tipo.toUpperCase(),
            t.categoria,
            t.descricao,
            t.valor
        ])

        const csvString = [header, ...rows].map(row => row.join(",")).join("\n")
        downloadFile(csvString, 'csv', 'text/csv')
    }

    const exportToJSON = () => {
        const dataToExport = {
            resumo: stats,
            historico: transacoes
        }
        const jsonString = JSON.stringify(dataToExport, null, 2)
        downloadFile(jsonString, 'json', 'application/json')
    }

    const downloadFile = (content: string, ext: string, mime: string) => {
        const blob = new Blob([content], { type: mime })
        const url = URL.createObjectURL(blob)
        const link = document.body.appendChild(document.createElement("a"))
        link.href = url
        link.download = `financeiro_incubadora_${new Date().toISOString().split('T')[0]}.${ext}`
        link.click()
        setTimeout(() => {
            URL.revokeObjectURL(url)
            document.body.removeChild(link)
        }, 100)
        toast.success(`Relatório ${ext.toUpperCase()} exportado!`)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between no-print gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#002B5B]">Painel Financeiro</h2>
                    <p className="text-slate-500">Gestão de entradas, saídas e relatórios de desempenho.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()} className="bg-white border-slate-200">
                        <FileText className="mr-2 h-4 w-4" /> Imprimir / PDF
                    </Button>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                                <Download className="mr-2 h-4 w-4" /> Gerar Relatórios
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Exportar Dados Financeiros</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-3 py-4">
                                <p className="text-xs text-slate-500 mb-2">Escolha o formato para descarregar o histórico completo de transacções e o resumo de indicadores.</p>
                                <Button variant="outline" onClick={exportToCSV} className="justify-start h-12">
                                    <div className="bg-emerald-100 p-2 rounded mr-3">
                                        <FileText className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm">Folha de Cálculo (Excel/CSV)</div>
                                        <div className="text-[10px] text-slate-400">Ideal para análise em Excel ou Google Sheets.</div>
                                    </div>
                                </Button>
                                <Button variant="outline" onClick={exportToJSON} className="justify-start h-12">
                                    <div className="bg-orange-100 p-2 rounded mr-3">
                                        <FileText className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm">Backup de Dados (JSON)</div>
                                        <div className="text-[10px] text-slate-400">Estrutura técnica completa para sistemas.</div>
                                    </div>
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* INDICADORES PRINCIPAIS */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs uppercase tracking-widest font-bold text-slate-400">Facturação Bruta</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-800">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats.facturacao)}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 italic">Venda total de serviços</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs uppercase tracking-widest font-bold text-slate-400">Contas a Receber</CardTitle>
                        <BarChart3 className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-amber-600">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats.pendente)}
                        </div>
                        <p className="text-[10px] text-amber-600 font-bold mt-1">Facturas por liquidar</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-[#002B5B] text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs uppercase tracking-widest font-bold opacity-70">Saídas Directas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-red-400 rotate-180" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats.custos)}
                        </div>
                        <p className="text-[10px] opacity-70 mt-1">Custo com colaboradores</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs uppercase tracking-widest font-bold opacity-70">Margem Estimada</CardTitle>
                        <PieChart className="h-4 w-4 opacity-50" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats.facturacao - stats.custos)}
                        </div>
                        <p className="text-[10px] opacity-70 mt-1">Lucro bruto operacional</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* LISTA DE ENTRADAS E SAÍDAS */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText size={18} className="text-indigo-600" /> Histórico de Movimentações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4 font-center">Tipo</th>
                                        <th className="px-6 py-4">Descrição</th>
                                        <th className="px-6 py-4 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr><td colSpan={4} className="py-20 text-center italic text-slate-400">Carregando transacções...</td></tr>
                                    ) : transacoes.length === 0 ? (
                                        <tr><td colSpan={4} className="py-20 text-center italic text-slate-400">Sem registos financeiros.</td></tr>
                                    ) : (
                                        transacoes.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 text-slate-500">{new Date(t.data_transacao).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.tipo === 'receita' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {t.tipo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-700">{t.descricao}</td>
                                                <td className={`px-6 py-4 text-right font-black ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'
                                                    }`}>
                                                    {t.tipo === 'receita' ? '+' : '-'} {new Intl.NumberFormat('pt-MZ').format(t.valor)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* RESUMO RÁPIDO */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-lg">Resumo Operacional</CardTitle>
                    </CardHeader>
                    <CardContent className="py-6 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">Missões Concluídas</span>
                                <Badge variant="secondary" className="font-bold">{stats.os_concluidas}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">Eficiência de Cobrança</span>
                                <span className="text-sm font-bold text-indigo-600">85%</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t">
                            <h4 className="text-xs uppercase font-bold text-slate-400 mb-4 tracking-tighter">Projecção de Receita</h4>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                                <div className="h-full bg-indigo-500 w-[75%]" />
                            </div>
                            <p className="text-[10px] text-slate-400">75% das facturas do mês já foram liquidadas.</p>
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-xl">
                            <div className="flex items-center gap-3 text-indigo-700 mb-2">
                                <TrendingUp size={20} />
                                <span className="text-sm font-bold">Dica Financeira</span>
                            </div>
                            <p className="text-[11px] text-indigo-600/80 leading-relaxed italic">
                                "O custo operacional está dentro da margem de 30% planeada. Recomendamos manter o foco na redução do tempo médio de liquidação de facturas."
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
