'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, TrendingUp, HandCoins, AlertCircle, CheckCircle2 } from 'lucide-react'
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

export default function CarteiraPage() {
    const [loading, setLoading] = useState(true)
    const [wallet, setWallet] = useState<any>(null)
    const [transactions, setTransactions] = useState<any[]>([])
    const [summary, setSummary] = useState({ available: 0, frozen: 0, pendingExpenses: 0 })
    const [activeCredits, setActiveCredits] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        fetchWalletData()
    }, [])

    const fetchWalletData = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Get Wallet
            const { data: walletData } = await supabase
                .from('carteiras')
                .select('*')
                .eq('user_id', user.id)
                .single()

            setWallet(walletData)

            // 2. Get Transactions
            if (walletData) {
                const { data: transData } = await supabase
                    .from('transacoes_carteira')
                    .select('*')
                    .eq('carteira_id', walletData.id)
                    .order('created_at', { ascending: false })

                setTransactions(transData || [])
            }

            // 3. Get OS Data for Expenses Logic
            const { data: colabData } = await supabase.from('colaboradores').select('id').eq('user_id', user.id).single()

            if (colabData) {
                const { data: osData } = await supabase
                    .from('ordens_servico')
                    .select('valor_colaborador, despesas_adicionais, estado')
                    .eq('colaborador_id', colabData.id)
                    .neq('estado', 'paga')

                let pendingExpenses = 0
                osData?.forEach(os => {
                    const expenses = os.despesas_adicionais || []
                    expenses.forEach((e: any) => pendingExpenses += (e.valor || 0))
                })

                setSummary({
                    available: walletData?.saldo_disponivel || 0,
                    frozen: walletData?.saldo_cativo || 0,
                    pendingExpenses
                })

                // 4. Get Active Credits (Debts)
                const { data: creditsData } = await supabase
                    .from('creditos')
                    .select('*')
                    .eq('user_id', user.id)
                    .in('estado', ['aprovado', 'atraso'])

                setActiveCredits(creditsData || [])
            }

        } catch (error) {
            console.error(error)
            toast.error('Erro ao carregar dados da carteira')
        } finally {
            setLoading(false)
        }
    }

    const handlePayCredit = async (credit: any) => {
        const totalToPay = credit.valor_aprovado * (1 + credit.taxa_juros)
        if (wallet.saldo_disponivel < totalToPay) {
            return toast.error('Saldo insuficiente para liquidar esta dívida.')
        }

        if (!confirm(`Deseja liquidar este crédito de ${new Intl.NumberFormat('pt-MZ').format(totalToPay)} MT?`)) return

        try {
            // 1. Descontar da Carteira
            const { error: wError } = await supabase
                .from('carteiras')
                .update({ saldo_disponivel: wallet.saldo_disponivel - totalToPay })
                .eq('id', wallet.id)

            if (wError) throw wError

            // 2. Registar Transacção na Carteira
            await supabase.from('transacoes_carteira').insert({
                carteira_id: wallet.id,
                tipo: 'pagamento_credito',
                valor: totalToPay,
                descricao: `Liquidação de Crédito Mali: Ref #${credit.id.slice(0, 8)}`
            })

            // 3. Marcar Crédito como Pago
            await supabase
                .from('creditos')
                .update({ estado: 'pago', total_pago: totalToPay })
                .eq('id', credit.id)

            // 4. REGISTAR NA CARTEIRA MASTER COMO RECEITA (Retorno de capital Mali Ya Mina)
            const { data: colab } = await supabase.from('colaboradores').select('nome').eq('user_id', credit.user_id).single()
            await supabase.from('transacoes_master').insert({
                tipo: 'receita',
                categoria: 'mali_credito_retorno',
                valor: totalToPay,
                descricao: `Recebimento de Crédito Mali: ${colab?.nome || 'Colaborador'}`,
                referencia_id: credit.id
            })

            toast.success('Dívida liquidada com sucesso!')
            fetchWalletData()
        } catch (error: any) {
            toast.error('Erro ao processar pagamento: ' + error.message)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando carteira digital...</div>

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Minha Carteira Digital</h2>
                    <p className="text-slate-500">Gira o seu saldo, veja os seus lucros e acompanhe as suas despesas.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                        <ArrowDownCircle className="mr-2 h-4 w-4" /> Solicitar Levantamento
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-none shadow-lg shadow-indigo-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-100">Saldo Disponível</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(summary.available)}
                        </div>
                        <p className="text-xs text-indigo-200 mt-1">Pronto para levantar ou usar em serviços Mali</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-slate-500">Saldo Cativo</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(summary.frozen)}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Reservado para compromissos financeiros</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-slate-500">Despesas Pendentes</CardTitle>
                        <AlertCircle className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(summary.pendingExpenses)}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Valores a serem reembolsados via OS</p>
                    </CardContent>
                </Card>
            </div>

            {/* Active Debts (Créditos a Pagar) */}
            {activeCredits.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <HandCoins className="text-amber-600" /> Dívidas em Aberto (Mali Ya Mina)
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {activeCredits.map(credit => {
                            const total = credit.valor_aprovado * (1 + credit.taxa_juros)
                            return (
                                <Card key={credit.id} className="border-amber-200 bg-amber-50/30 overflow-hidden">
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-amber-600">Total a Liquidar</p>
                                                <p className="text-2xl font-black text-amber-900">{new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(total)}</p>
                                            </div>
                                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
                                                Juros: {(credit.taxa_juros * 100).toFixed(0)}%
                                            </Badge>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>Capital: {new Intl.NumberFormat('pt-MZ').format(credit.valor_aprovado)} MT</span>
                                                <span>Aprovado em: {new Date(credit.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <Button
                                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                                onClick={() => handlePayCredit(credit)}
                                            >
                                                Pagar com meu Saldo
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Quick Actions for Mali Ya Mina */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:border-indigo-300 transition-colors cursor-pointer group">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                            <HandCoins className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold group-hover:text-indigo-600 transition-colors">Solicitar Crédito</p>
                            <p className="text-[10px] text-slate-400">Até 30% do seu saldo médio</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:border-indigo-300 transition-colors cursor-pointer group">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold group-hover:text-indigo-600 transition-colors">Entrar num Txuna</p>
                            <p className="text-[10px] text-slate-400">Poupança conjunta mensal</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions History */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle className="text-base">Histórico de Movimentações</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-400">
                                        Nenhuma transação registada na sua carteira digital.
                                    </TableCell>
                                </TableRow>
                            ) : transactions.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell className="text-xs text-slate-500">
                                        {new Date(t.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {t.tipo.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-xs font-medium">
                                        {t.descricao}
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${['levantamento', 'transferencia', 'contribuicao_grupo', 'pagamento_credito'].includes(t.tipo) ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {['levantamento', 'transferencia', 'contribuicao_grupo', 'pagamento_credito'].includes(t.tipo) ? '-' : '+'}
                                        {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(t.valor)}
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
