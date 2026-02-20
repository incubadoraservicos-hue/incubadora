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

        // 2. Buscar Ordens de Serviço CONCLUÍDAS (mas ainda não pagas pelo Master)
        // Nota: O estado 'concluida' significa que o colaborador terminou, 
        // mas o pagamento ainda não foi processado aqui.
        const { data: osConcluidas, error: osError } = await supabase
            .from('ordens_servico')
            .select('colaborador_id, valor_colaborador')
            .eq('estado', 'concluida')

        if (osError) {
            toast.error('Erro ao calcular saldos pendentes')
        }

        // 3. Mapear os saldos calculados em tempo real
        const colabsComSaldo = (colabs || []).map(c => {
            const totalOS = (osConcluidas || [])
                .filter(os => os.colaborador_id === c.id)
                .reduce((acc, curr) => acc + (Number(curr.valor_colaborador) || 0), 0)

            return {
                ...c,
                saldo_pendente: totalOS // Usamos o cálculo em tempo real
            }
        })

        setColaboradores(colabsComSaldo)
        setLoading(false)
    }

    const handleConfirmarPagamento = async (colabId: string) => {
        const colab = colaboradores.find(c => c.id === colabId)
        if (!colab || !colab.saldo_pendente) return

        if (!confirm(`Confirmar o pagamento de ${new Intl.NumberFormat('pt-MZ').format(colab.saldo_pendente)} MT para ${colab.nome}?`)) return

        // 1. Marcar OS como pagas
        const { error } = await supabase
            .from('ordens_servico')
            .update({
                estado: 'paga',
                data_pagamento: new Date().toISOString()
            })
            .eq('colaborador_id', colabId)
            .eq('estado', 'concluida')

        if (error) {
            toast.error('Erro ao processar pagamento: ' + error.message)
        } else {
            // 2. Registo no Dashboard Financeiro (Saída de Caixa)
            await supabase.from('transacoes_master').insert({
                tipo: 'despesa',
                categoria: 'pagamento_colaborador',
                valor: colab.saldo_pendente,
                descricao: `Liquidação de Saldo: ${colab.nome}`,
                referencia_id: colabId
            })

            toast.success('Pagamento confirmado e caixa actualizado!')
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
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(
                                colaboradores.reduce((acc, c) => acc + (c.saldo_pendente || 0), 0)
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
                            <TableHead>Saldo Pendente</TableHead>
                            <TableHead>Último Pagamento</TableHead>
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
                                <TableCell className="text-slate-400 text-xs text-italic">Sem registos recentes</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                                        disabled={!colab.saldo_pendente || colab.saldo_pendente <= 0}
                                        onClick={() => handleConfirmarPagamento(colab.id)}
                                    >
                                        Confirmar Pagamento
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
