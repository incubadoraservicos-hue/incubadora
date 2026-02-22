'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    CreditCard,
    Wallet,
    History,
    CheckCircle2,
    ArrowUpRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { toast } from 'sonner'

export default function PagamentosPage() {
    const [colaboradores, setColaboradores] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchSaldos()
    }, [])

    const fetchSaldos = async () => {
        setLoading(true)

        // 1. Buscar todos os colaboradores
        const { data: colabs, error: colabError } = await supabase
            .from('colaboradores')
            .select('*')
            .order('nome')

        if (colabError) {
            toast.error('Erro ao carregar colaboradores')
            setLoading(false)
            return
        }

        // 2. Buscar Ordens de Serviço (Tanto o Fee do Colaborador quanto as Despesas)
        // Filtramos para ignorar as já pagas ou canceladas
        const { data: osData, error: osError } = await supabase
            .from('ordens_servico')
            .select('colaborador_id, valor_colaborador, despesas_adicionais, estado')
            .neq('estado', 'paga')
            .neq('estado', 'cancelada')

        if (osError) {
            console.error('Erro OS:', osError)
            toast.error('Erro ao carregar Ordens de Serviço: ' + osError.message)
            setLoading(false)
            return
        }

        // 3. Mapear os saldos calculados em tempo real
        const colabsComSaldo = (colabs || []).map(c => {
            const osDoColab = (osData || []).filter(os => os.colaborador_id === c.id)

            // Honorários: Apenas OS concluídas (prontas para pagamento)
            const saldoServicos = osDoColab
                .filter(os => os.estado === 'concluida')
                .reduce((acc, curr) => acc + (Number(curr.valor_colaborador) || 0), 0)

            // Despesas: Todas as despesas de OS que não estão pagas/canceladas
            const despesasPendentes = osDoColab.reduce((acc, os) => {
                const expenses = os.despesas_adicionais
                if (!Array.isArray(expenses)) return acc

                const sumOS = expenses.reduce((s: number, e: any) => {
                    const val = typeof e.valor === 'string' ? parseFloat(e.valor) : Number(e.valor)
                    return s + (isNaN(val) ? 0 : val)
                }, 0)

                return acc + sumOS
            }, 0)

            return {
                ...c,
                saldo_pendente: saldoServicos,
                despesas_pendentes: despesasPendentes
            }
        })

        // Filtrar apenas colaboradores que têm algo pendente para não encher a lista
        const apenasComPendencias = colabsComSaldo.filter(c =>
            (c.saldo_pendente > 0) || (c.despesas_pendentes > 0)
        )

        setColaboradores(apenasComPendencias)
        setLoading(false)
    }

    const handleConfirmarPagamento = async (colabId: string) => {
        const colab = colaboradores.find(c => c.id === colabId)
        if (!colab) return

        const totalLiquidar = (colab.saldo_pendente || 0) + (colab.despesas_pendentes || 0)
        if (totalLiquidar <= 0) return

        if (!confirm(`Confirmar o pagamento TOTAL de ${new Intl.NumberFormat('pt-MZ').format(totalLiquidar)} MT para ${colab.nome} (Honorários + Despesas)?`)) return

        // 1. Marcar OS como pagas (apenas as que contribuíram para o saldo ou despesas)
        const { error } = await supabase
            .from('ordens_servico')
            .update({
                estado: 'paga',
                data_pagamento: new Date().toISOString()
            })
            .eq('colaborador_id', colabId)
            .neq('estado', 'paga')
            .neq('estado', 'cancelada')

        if (error) {
            toast.error('Erro ao processar pagamento: ' + error.message)
        } else {
            // 2. Registo no Dashboard Financeiro (Saída de Caixa)
            await supabase.from('transacoes_master').insert({
                tipo: 'despesa',
                categoria: 'pagamento_colaborador',
                valor: totalLiquidar,
                descricao: `Liquidação Total (Honorários + Despesas): ${colab.nome}`,
                referencia_id: colabId
            })

            toast.success('Pagamento total confirmado e caixa actualizado!')
            fetchSaldos()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Saldos & Pagamentos</h2>
                    <p className="text-slate-500">Controlo de pagamentos para a rede de colaboradores.</p>
                </div>
                <Button variant="outline">
                    <History className="mr-2 h-4 w-4" /> Histórico Geral
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm bg-slate-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase text-slate-500">Total Global Pendente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-600">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(
                                colaboradores.reduce((acc, c) => acc + (c.saldo_pendente || 0) + (c.despesas_pendentes || 0), 0)
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase text-slate-500">Só Honorários (OS)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-slate-700">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(
                                colaboradores.reduce((acc, c) => acc + (c.saldo_pendente || 0), 0)
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase text-slate-500">Só Despesas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-amber-600">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(
                                colaboradores.reduce((acc, c) => acc + (c.despesas_pendentes || 0), 0)
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader>
                    <CardTitle className="text-lg">Resumo por Colaborador</CardTitle>
                </CardHeader>
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Honorários (OS)</TableHead>
                            <TableHead>Despesas (Pendentes)</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-10">Carregando...</TableCell></TableRow>
                        ) : colaboradores.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-10">Nenhum colaborador com saldo.</TableCell></TableRow>
                        ) : colaboradores.map(colab => (
                            <TableRow key={colab.id}>
                                <TableCell className="font-medium">{colab.nome}</TableCell>
                                <TableCell>
                                    <span className={colab.saldo_pendente > 0 ? "text-red-600 font-bold" : "text-green-600"}>
                                        {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(colab.saldo_pendente || 0)}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={colab.despesas_pendentes > 0 ? "text-amber-600 font-bold underline" : "text-slate-400"}>
                                        {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(colab.despesas_pendentes || 0)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 h-8 text-xs"
                                        disabled={(!colab.saldo_pendente || colab.saldo_pendente <= 0) && (!colab.despesas_pendentes || colab.despesas_pendentes <= 0)}
                                        onClick={() => handleConfirmarPagamento(colab.id)}
                                    >
                                        Liquidar Total
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
