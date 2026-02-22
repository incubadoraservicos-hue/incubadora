'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Tags, Users, Wallet, TrendingUp, ShieldCheck, Power, Settings2,
    Plus, CheckCircle, XCircle, AlertCircle, Ban, ArrowUpCircle
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function MaliYaMinaMasterPage() {
    const [loading, setLoading] = useState(true)
    const [empresa, setEmpresa] = useState<any>(null)
    const [subscritores, setSubscritores] = useState<any[]>([])
    const [colaboradores, setColaboradores] = useState<any[]>([])
    const [grupos, setGrupos] = useState<any[]>([])
    const [creditos, setCreditos] = useState<any[]>([])
    const [financingRequests, setFinancingRequests] = useState<any[]>([])

    // Configurações
    const [config, setConfig] = useState({
        credito_max_colaborador: 5000,
        saldo_min_colaborador: 1000,
        juros_credito_colab: 0.10,
        juros_credito_subscritor: 0.30,
        capital_min_ativacao: 50000,
        percentagem_max_reserva: 0.20
    })

    const [stats, setStats] = useState({
        capitalTxuna: 0,
        jurosGerados: 0,
        creditosAtivos: 0,
        totalBancada: 0
    })

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Executar queries individualmente para não crashar se uma falhar (ex: cache do supabase)
            const empRes = await supabase.from('empresas').select('*').single()
            if (!empRes.data) {
                toast.error('Nenhum dado da empresa encontrado. Por favor, execute o script de correção SQL.')
                return
            }
            setEmpresa(empRes.data)
            if (empRes.data.config_financeira) {
                setConfig({ ...config, ...empRes.data.config_financeira })
            }

            const subRes = await supabase.from('mali_subscritores').select('*').order('created_at', { ascending: false })
            if (subRes.data) setSubscritores(subRes.data)

            const colRes = await supabase.from('colaboradores').select('*').order('nome')
            if (colRes.data) setColaboradores(colRes.data)

            const grupRes = await supabase.from('mali_grupos').select('*')
            if (grupRes.data) setGrupos(grupRes.data)

            const credRes = await supabase.from('creditos').select('*, colaboradores(nome), mali_subscritores(nome)').order('created_at', { ascending: false })
            const creditsData = credRes.data || []
            setCreditos(creditsData)

            const transRes = await supabase.from('transacoes_master').select('*').eq('categoria', 'mali_financiamento_incubadora')
            if (transRes.data) setFinancingRequests(transRes.data)

            // CALCULAR STATS REAIS
            const ativos = creditsData
                .filter(c => ['aprovado', 'atraso'].includes(c.estado))
                .reduce((acc, c) => acc + (Number(c.valor_aprovado) || 0), 0)

            const juros = creditsData
                .filter(c => c.estado === 'pago')
                .reduce((acc, c) => acc + ((Number(c.total_pago) || 0) - (Number(c.valor_aprovado) || 0)), 0)

            const txuna = (grupRes.data || [])
                .filter(g => g.estado === 'activo')
                .reduce((acc, g) => acc + (Number(g.valor_contribuicao) || 0), 0)

            // Cálculo da Bancada (Dinheiro que Mali recebeu da Incubadora)
            const bancadaTotal = (transRes.data || [])
                .filter(t => t.tipo === 'receita' || t.categoria === 'mali_financiamento_incubadora')
                .reduce((acc, t) => acc + Number(t.valor), 0)

            setStats({
                creditosAtivos: ativos,
                jurosGerados: juros,
                capitalTxuna: txuna,
                totalBancada: bancadaTotal
            })

        } catch (error) {
            console.error('Erro ao carregar dados:', error)
            toast.error('Alguns dados financeiros podem estar indisponíveis no momento.')
        } finally {
            setLoading(false)
        }
    }

    const saveSettings = async () => {
        if (!empresa?.id) {
            toast.error('Não foi possível identificar a empresa para salvar.')
            return
        }

        const { error } = await supabase
            .from('empresas')
            .update({ config_financeira: config })
            .eq('id', empresa.id)

        if (error) {
            console.error(error)
            toast.error('Erro ao guardar configurações: ' + error.message)
        } else {
            toast.success('Configurações Mali actualizadas!')
            fetchData()
        }
    }

    const handleUpdateUserStatus = async (type: 'colab' | 'sub', id: string, newStatus: string) => {
        const table = type === 'colab' ? 'colaboradores' : 'mali_subscritores'
        const { error } = await supabase
            .from(table)
            .update({ estado: newStatus })
            .eq('id', id)

        if (error) toast.error('Erro ao atualizar estado')
        else {
            toast.success('Estado atualizado com sucesso')
            fetchData()
        }
    }

    const handleApproveSubscriber = async (sub: any) => {
        const { error } = await supabase
            .from('mali_subscritores')
            .update({ estado: 'activo' })
            .eq('id', sub.id)

        if (error) toast.error('Erro ao aprovar')
        else {
            toast.success(`Subscritor ${sub.nome} aprovado!`)
            fetchData()
        }
    }

    const requestFinancing = async () => {
        const valor = prompt('Quanto financiamento deseja solicitar à Incubadora?')
        if (!valor || isNaN(Number(valor))) return

        // Nesta lógica, Mali solicita à Incubadora. Para o Master, é uma transferência entre "contas"
        // Criamos uma transação que fica pendente ou é aprovada imediatamente pelo Master
        const { error } = await supabase.from('transacoes_master').insert({
            tipo: 'despesa', // Sai da Incubadora
            categoria: 'mali_financiamento_incubadora',
            valor: Number(valor),
            descricao: 'Financiamento de Capital para Operações Mali Ya Mina',
            referencia_id: empresa.id
        })

        if (error) toast.error('Erro ao solicitar financiamento')
        else {
            toast.success('Financiamento aprovado! O capital está disponível na bancada Mali.')
            fetchData()
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">A analisar ecossistema financeiro...</div>

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/30">
                        <Tags size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">Mali Ya Mina <span className="text-indigo-600">Hub</span></h2>
                        <p className="text-slate-500 font-medium tracking-tight">Painel Administrativo da Instituição Financeira Mali.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        onClick={requestFinancing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-indigo-200"
                    >
                        <ArrowUpCircle className="mr-2 h-5 w-5" /> Solicitar Financiamento
                    </Button>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="flex flex-col pr-4 border-r">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Estado Global</span>
                            <Badge className={empresa?.mali_mina_activo ? 'bg-emerald-50 text-emerald-600 border-none' : 'bg-rose-50 text-rose-600 border-none'}>
                                {empresa?.mali_mina_activo ? 'Em Operação' : 'Encerrado'}
                            </Badge>
                        </div>
                        <Switch
                            checked={empresa?.mali_mina_activo}
                            onCheckedChange={async (checked) => {
                                const { error } = await supabase.from('empresas').update({ mali_mina_activo: checked }).eq('id', empresa.id)
                                if (!error) setEmpresa({ ...empresa, mali_mina_activo: checked })
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-white border-none shadow-sm h-32 flex flex-col justify-center">
                    <CardHeader className="pb-1 py-0">
                        <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bancada Mali</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0">
                        <div className="text-2xl font-black text-slate-900">{new Intl.NumberFormat('pt-MZ').format(stats.totalBancada)} MT</div>
                        <p className="text-[10px] text-indigo-600 font-bold mt-1 uppercase">Capital Disponível</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-sm h-32 flex flex-col justify-center">
                    <CardHeader className="pb-1 py-0">
                        <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Crédito Activo</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0">
                        <div className="text-2xl font-black text-amber-600">{new Intl.NumberFormat('pt-MZ').format(stats.creditosAtivos)} MT</div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Em mãos de terceiros</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-sm h-32 flex flex-col justify-center">
                    <CardHeader className="pb-1 py-0">
                        <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lucro Mali</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0">
                        <div className="text-2xl font-black text-emerald-600">{new Intl.NumberFormat('pt-MZ').format(stats.jurosGerados)} MT</div>
                        <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">Juros Brutos Recolhidos</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-sm h-32 flex flex-col justify-center">
                    <CardHeader className="pb-1 py-0">
                        <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Membros Hub</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0">
                        <div className="text-2xl font-black text-slate-900">{subscritores.length + colaboradores.filter(c => c.estado !== 'pendente').length}</div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Clientes Totais MALI</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="management" className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
                    <TabsTrigger value="management" className="rounded-lg font-bold text-xs px-6">Gestão Operacional</TabsTrigger>
                    <TabsTrigger value="subscribers" className="rounded-lg font-bold text-xs px-6">Subscritores & Colabs</TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-lg font-bold text-xs px-6">Configurações Base</TabsTrigger>
                </TabsList>

                <TabsContent value="management" className="space-y-8">
                    {/* Créditos em Aberto */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-base font-black">Filas de Crédito</CardTitle>
                            <CardDescription className="text-xs">Aprovação e monitoria de desembolsos.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-[10px] uppercase font-black">Solicitante</TableHead>
                                        <TableHead className="text-[10px] uppercase font-black">Tipo</TableHead>
                                        <TableHead className="text-[10px] uppercase font-black">Valor</TableHead>
                                        <TableHead className="text-[10px] uppercase font-black">Estado</TableHead>
                                        <TableHead className="text-right text-[10px] uppercase font-black">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {creditos.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-400">Sem créditos solicitados.</TableCell></TableRow>
                                    ) : creditos.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-bold text-xs">{c.colaboradores?.nome || c.mali_subscritores?.nome || 'Utilizador'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[9px] font-black uppercase">
                                                    {c.colaboradores ? 'Colaborador' : 'Subscritor'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-black text-indigo-700">{new Intl.NumberFormat('pt-MZ').format(c.valor_solicitado)} MT</TableCell>
                                            <TableCell>
                                                <Badge className={`text-[9px] font-black uppercase border-none ${c.estado === 'pendente' ? 'bg-amber-100 text-amber-600' :
                                                    c.estado === 'aprovado' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    {c.estado}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {c.estado === 'pendente' && (
                                                    <div className="flex justify-end gap-1">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => { }}>
                                                            <CheckCircle size={16} />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600">
                                                            <XCircle size={16} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subscribers" className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Subscritores Externos */}
                        <Card className="border-none shadow-sm overflow-hidden bg-white">
                            <CardHeader className="bg-slate-50 border-b">
                                <CardTitle className="text-base font-bold">Inscrições Pendentes</CardTitle>
                                <CardDescription className="text-xs">Subscritores externos aguardando aprovação.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableBody>
                                        {subscritores.filter(s => s.estado === 'pendente').map(sub => (
                                            <TableRow key={sub.id}>
                                                <TableCell className="text-xs font-bold">{sub.nome}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold text-emerald-600 border-emerald-100" onClick={() => handleApproveSubscriber(sub)}>Aprovar</Button>
                                                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold text-rose-600 border-rose-100">Recusar</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Controlo de Bloqueio */}
                        <Card className="border-none shadow-sm overflow-hidden bg-white">
                            <CardHeader className="bg-slate-50 border-b">
                                <CardTitle className="text-base font-bold text-rose-900 flex items-center gap-2">
                                    <Ban className="h-4 w-4" /> Zona de Risco & Bloqueio
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableBody>
                                        {colaboradores.slice(0, 5).map(col => (
                                            <TableRow key={col.id}>
                                                <TableCell className="text-xs font-bold">{col.nome} <span className="text-[10px] text-slate-400">(Colaborador)</span></TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className={`h-7 text-[10px] font-black uppercase ${col.estado === 'bloqueado' ? 'text-emerald-600' : 'text-rose-600'}`}
                                                        onClick={() => handleUpdateUserStatus('colab', col.id, col.estado === 'bloqueado' ? 'activo' : 'bloqueado')}
                                                    >
                                                        {col.estado === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-black text-indigo-900">Motor de Regras Mali</CardTitle>
                            <CardDescription className="text-xs font-medium">Configure as variáveis financeiras que regem o ecossistema.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            <div className="grid gap-8 md:grid-cols-2">
                                <div className="space-y-6 p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                                    <h3 className="text-xs font-black uppercase text-indigo-700 tracking-widest flex items-center gap-2">
                                        <Users className="h-4 w-4" /> Regras p/ Colaboradores
                                    </h3>
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold">Limite de Crédito Máximo (MT)</Label>
                                            <Input type="number" value={config.credito_max_colaborador} onChange={e => setConfig({ ...config, credito_max_colaborador: Number(e.target.value) })} className="h-10 font-bold bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold">Saldo Mínimo p/ Solicitar (MT)</Label>
                                            <Input type="number" value={config.saldo_min_colaborador} onChange={e => setConfig({ ...config, saldo_min_colaborador: Number(e.target.value) })} className="h-10 font-bold bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold">Taxa de Juros Especial (%)</Label>
                                            <Input type="number" step="0.01" value={config.juros_credito_colab} onChange={e => setConfig({ ...config, juros_credito_colab: Number(e.target.value) })} className="h-10 font-bold bg-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                    <h3 className="text-xs font-black uppercase text-slate-700 tracking-widest flex items-center gap-2">
                                        <Settings2 className="h-4 w-4" /> Parâmetros de Protocolo
                                    </h3>
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold">Capital Mín. p/ Activar Mali (Bancada)</Label>
                                            <Input type="number" value={config.capital_min_ativacao} onChange={e => setConfig({ ...config, capital_min_ativacao: Number(e.target.value) })} className="h-10 font-bold bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold">Juros Subscritor Externo (%)</Label>
                                            <Input type="number" step="0.01" value={config.juros_credito_subscritor} onChange={e => setConfig({ ...config, juros_credito_subscritor: Number(e.target.value) })} className="h-10 font-bold bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold">% Máxima de Reserva Emergencial</Label>
                                            <Input type="number" step="0.01" value={config.percentagem_max_reserva} onChange={e => setConfig({ ...config, percentagem_max_reserva: Number(e.target.value) })} className="h-10 font-bold bg-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={saveSettings} className="bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-10 rounded-xl shadow-lg shadow-indigo-100">
                                    Guardar Configurações MALI
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
