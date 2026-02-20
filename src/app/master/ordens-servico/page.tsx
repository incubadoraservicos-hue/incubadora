'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Plus,
    ClipboardList,
    Clock,
    CheckCircle2,
    User,
    MoreVertical,
    Banknote
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
    const [loading, setLoading] = useState(true)
    const [isNewOpen, setIsNewOpen] = useState(false)
    const supabase = createClient()

    const [formData, setFormData] = useState({
        colaborador_id: '',
        descricao: '',
        valor: '',
        prazo: '',
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const [osRes, colabRes] = await Promise.all([
            supabase.from('ordens_servico').select('*, colaboradores(nome)').order('created_at', { ascending: false }),
            supabase.from('colaboradores').select('id, nome').eq('estado', 'activo')
        ])

        if (osRes.error) toast.error('Erro ao carregar OS')
        else setOs(osRes.data || [])

        if (colabRes.data) setColaboradores(colabRes.data)
        setLoading(false)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()

        // Generate simple number for demo
        const numero = `OS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

        const { error } = await supabase.from('ordens_servico').insert([
            { ...formData, valor: parseFloat(formData.valor), numero, estado: 'enviada' }
        ])

        if (error) toast.error('Erro: ' + error.message)
        else {
            toast.success('Ordem de Serviço enviada!')
            setIsNewOpen(false)
            setFormData({ colaborador_id: '', descricao: '', valor: '', prazo: '' })
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
                                <div className="grid gap-2">
                                    <Label>Colaborador</Label>
                                    <Select onValueChange={v => setFormData({ ...formData, colaborador_id: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione um colaborador" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {colaboradores.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                        <Label>Valor a Pagar (MT)</Label>
                                        <Input
                                            type="number"
                                            value={formData.valor}
                                            onChange={e => setFormData({ ...formData, valor: e.target.value })}
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
                            </div>
                            <DialogFooter>
                                <Button type="submit">Enviar OS</Button>
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
                            <TableHead>Colaborador</TableHead>
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
                                <TableCell>{item.colaboradores?.nome}</TableCell>
                                <TableCell className="max-w-[200px] truncate text-slate-600 text-xs">{item.descricao}</TableCell>
                                <TableCell className="text-xs">{item.prazo ? new Date(item.prazo).toLocaleDateString() : '---'}</TableCell>
                                <TableCell className="font-bold">
                                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(item.valor)}
                                </TableCell>
                                <TableCell>{getStatusBadge(item.estado)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon"><MoreVertical size={16} /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
