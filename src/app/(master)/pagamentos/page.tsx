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
        const { data, error } = await supabase
            .from('colaboradores')
            .select('*')
            .order('saldo_pendente', { ascending: false })

        if (error) toast.error('Erro ao carregar saldos')
        else setColaboradores(data || [])
        setLoading(false)
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
