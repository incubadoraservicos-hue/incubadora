'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, PieChart, TrendingUp, Download, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RelatoriosPage() {
    const supabase = createClient()
    const [stats, setStats] = useState({ facturacao: 0, pendente: 0, os_concluidas: 0 })

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        const { data: fRes } = await supabase.from('facturas').select('total, estado')
        const { count: osCount } = await supabase.from('ordens_servico').select('*', { count: 'exact', head: true }).eq('estado', 'concluida')

        if (fRes) {
            const total = fRes.reduce((acc, curr) => acc + curr.total, 0)
            const pendente = fRes.filter(f => f.estado !== 'paga').reduce((acc, curr) => acc + curr.total, 0)
            setStats({
                facturacao: total,
                pendente: pendente,
                os_concluidas: osCount || 0
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Relatórios & Insights</h2>
                    <p className="text-slate-500">Análise de desempenho, facturação e operações.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Calendar className="mr-2 h-4 w-4" /> Este Mês</Button>
                    <Button className="bg-indigo-600"><Download className="mr-2 h-4 w-4" /> Exportar Dados</Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Facturação Total</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats.facturacao)}</div>
                        <p className="text-xs text-slate-500">+12% em relação ao mês anterior</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
                        <BarChart3 className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats.pendente)}</div>
                        <p className="text-xs text-slate-500">7 facturas pendentes</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">OS Concluídas</CardTitle>
                        <PieChart className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.os_concluidas}</div>
                        <p className="text-xs text-slate-500">Taxa de sucesso: 94%</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Custo Operacional</CardTitle>
                        <TrendingUp className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45.000,00 MT</div>
                        <p className="text-xs text-slate-500">Pagamentos a colaboradores</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Desempenho por Sistema</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center text-slate-400 italic bg-slate-50 mt-2 rounded-lg">
                        Gráfico de barras (SaaS vs Outros) será renderizado aqui.
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Fluxo de Caixa (Mensal)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center text-slate-400 italic bg-slate-50 mt-2 rounded-lg">
                        Gráfico de linha (Entradas vs Saídas) será renderizado aqui.
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
