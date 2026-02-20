'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Plus,
    ClipboardList,
    Clock,
    CheckCircle2,
    User,
    MoreVertical,
    Banknote,
    Trash,
    FileSignature
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export default function OrdensServicoPage() {
    const [os, setOs] = useState<any[]>([])
    const [colaboradores, setColaboradores] = useState<any[]>([])
    const [clientes, setClientes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isNewOpen, setIsNewOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState<any>(null)
    const supabase = createClient()

    const [formData, setFormData] = useState({
        colaborador_id: '',
        cliente_id: '',
        descricao: '',
        valor_colaborador: 0,
        prazo: '',
        despesas: [] as { tipo: string, valor: number, descricao: string }[]
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const [osRes, colabRes, clientRes] = await Promise.all([
            supabase.from('ordens_servico').select('*, colaboradores(nome), clientes(nome)').order('created_at', { ascending: false }),
            supabase.from('colaboradores').select('id, nome').eq('estado', 'activo'),
            supabase.from('clientes').select('id, nome').eq('estado', 'activo')
        ])

        if (osRes.error) toast.error('Erro ao carregar OS')
        else setOs(osRes.data || [])

        if (colabRes.data) setColaboradores(colabRes.data)
        if (clientRes.data) setClientes(clientRes.data)
        setLoading(false)
    }

    const addDespesa = () => {
        setFormData(prev => ({
            ...prev,
            despesas: [...prev.despesas, { tipo: 'Transporte', valor: 0, descricao: '' }]
        }))
    }

    const removeDespesa = (index: number) => {
        setFormData(prev => ({
            ...prev,
            despesas: prev.despesas.filter((_, i) => i !== index)
        }))
    }

    const updateDespesa = (index: number, field: string, value: any) => {
        const newDespesas = [...formData.despesas]
        newDespesas[index] = { ...newDespesas[index], [field]: value }
        setFormData({ ...formData, despesas: newDespesas })
    }

    const calculateTotal = () => {
        const extra = formData.despesas.reduce((acc, curr) => acc + Number(curr.valor), 0)
        return Number(formData.valor_colaborador) + extra
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()

        const numero = `OS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        const total = calculateTotal()

        const { error } = await supabase.from('ordens_servico').insert([
            {
                colaborador_id: formData.colaborador_id,
                cliente_id: formData.cliente_id,
                descricao: formData.descricao,
                valor_colaborador: formData.valor_colaborador,
                despesas_adicionais: formData.despesas,
                valor: total,
                numero,
                prazo: formData.prazo,
                estado: 'enviada'
            }
        ])

        if (error) toast.error('Erro: ' + error.message)
        else {
            toast.success('Ordem de Serviço enviada!')
            setIsNewOpen(false)
            setFormData({ colaborador_id: '', cliente_id: '', descricao: '', valor_colaborador: 0, prazo: '', despesas: [] })
            fetchData()
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmada': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Confirmada</Badge>
            case 'concluida': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">Concluída</Badge>
            case 'paga': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Paga</Badge>
            case 'enviada': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">Enviada</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Ordens de Serviço</h2>
                    <p className="text-slate-500">Atribuição e acompanhamento de tarefas para colaboradores.</p>
                </div>

                <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4" /> Criar OS
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Nova Ordem de Serviço</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Cliente</Label>
                                        <Select onValueChange={v => setFormData({ ...formData, cliente_id: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {clientes.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Colaborador</Label>
                                        <Select onValueChange={v => setFormData({ ...formData, colaborador_id: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {colaboradores.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Descrição do Serviço</Label>
                                    <Textarea
                                        value={formData.descricao}
                                        onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                        placeholder="O que deve ser executado?"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Valor do Técnico (MT)</Label>
                                        <Input
                                            type="number"
                                            value={formData.valor_colaborador}
                                            onChange={e => setFormData({ ...formData, valor_colaborador: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Prazo</Label>
                                        <Input
                                            type="date"
                                            value={formData.prazo}
                                            onChange={e => setFormData({ ...formData, prazo: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-blue-600 font-bold">Outras Despesas (Custo Operacional)</Label>
                                        <Button type="button" variant="ghost" size="sm" onClick={addDespesa} className="text-xs">
                                            <Plus className="h-3 w-3 mr-1" /> Adicionar
                                        </Button>
                                    </div>

                                    {formData.despesas.map((desp, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50 p-2 rounded border border-slate-100 relative group">
                                            <div className="col-span-4">
                                                <Select value={desp.tipo} onValueChange={v => updateDespesa(idx, 'tipo', v)}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Transporte">Transporte</SelectItem>
                                                        <SelectItem value="Alimentação">Alimentação</SelectItem>
                                                        <SelectItem value="Combustível">Combustível</SelectItem>
                                                        <SelectItem value="Comunicação">Comunicação</SelectItem>
                                                        <SelectItem value="Outro">Outro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-5">
                                                <Input
                                                    placeholder="Valor"
                                                    type="number"
                                                    className="h-8 text-xs"
                                                    value={desp.valor}
                                                    onChange={e => updateDespesa(idx, 'valor', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeDespesa(idx)} className="h-8 text-red-500">
                                                    <Trash className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="col-span-12">
                                                <Input
                                                    placeholder="Observação (ex: Recibo 123)"
                                                    className="h-7 text-[10px]"
                                                    value={desp.descricao}
                                                    onChange={e => updateDespesa(idx, 'descricao', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="bg-slate-900 text-white p-3 rounded-lg mt-4 flex justify-between items-center">
                                        <span className="text-xs opacity-70">CUSTO TOTAL DA MISSÃO:</span>
                                        <span className="font-bold text-lg">{new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(calculateTotal())}</span>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Emitir Missão</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Atribuído a</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Prazo</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acções</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-10">Carregando...</TableCell></TableRow>
                        ) : os.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400">Sem ordens de serviço.</TableCell></TableRow>
                        ) : os.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-mono text-xs font-bold">{item.numero}</TableCell>
                                <TableCell className="font-medium text-xs text-blue-600">{item.clientes?.nome || 'Vários'}</TableCell>
                                <TableCell className="text-xs">{item.colaboradores?.nome}</TableCell>
                                <TableCell className="max-w-[150px] truncate text-slate-600 text-xs">{item.descricao}</TableCell>
                                <TableCell className="text-xs">{item.prazo ? new Date(item.prazo).toLocaleDateString() : '---'}</TableCell>
                                <TableCell className="font-bold">
                                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(item.valor)}
                                </TableCell>
                                <TableCell>{getStatusBadge(item.estado)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {item.relatorio && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[10px] text-purple-600 border-purple-200 bg-purple-50"
                                                onClick={() => setSelectedReport(item)}
                                            >
                                                Ver Relatório
                                            </Button>
                                        )}
                                        {item.estado === 'concluida' && (
                                            <Link href={`/master/contratos/novo-termo?os_id=${item.id}`}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-[10px] text-amber-600 border-amber-200 bg-amber-50"
                                                >
                                                    <FileSignature className="h-3 w-3 mr-1" /> Gerar Termo
                                                </Button>
                                            </Link>
                                        )}
                                        <Button variant="ghost" size="icon"><MoreVertical size={16} /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Relatório da Missão: {selectedReport?.numero}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-700 whitespace-pre-wrap">
                            {selectedReport?.relatorio || 'Nenhum relatório enviado.'}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setSelectedReport(null)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
