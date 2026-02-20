'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Tags, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export default function GestaoServicosPage() {
    const supabase = createClient()
    const [servicos, setServicos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [newService, setNewService] = useState({ nome: '', descricao: '', preco_base: '' })

    useEffect(() => {
        fetchServicos()
    }, [])

    const fetchServicos = async () => {
        const { data } = await supabase.from('servicos').select('*').order('nome')
        if (data) setServicos(data)
        setLoading(false)
    }

    const handleCreate = async () => {
        if (!newService.nome || !newService.preco_base) return

        const { error } = await supabase.from('servicos').insert([{
            nome: newService.nome,
            descricao: newService.descricao,
            preco_base: parseFloat(newService.preco_base)
        }])

        if (error) toast.error('Erro ao criar serviço')
        else {
            toast.success('Serviço cadastrado!')
            setOpen(false)
            setNewService({ nome: '', descricao: '', preco_base: '' })
            fetchServicos()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Catálogo de Serviços</h2>
                    <p className="text-slate-500">Cadastre outros serviços além dos sistemas SaaS.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600">
                            <Plus className="mr-2 h-4 w-4" /> Novo Serviço
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registar Novo Serviço</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Nome do Serviço</Label>
                                <Input value={newService.nome} onChange={e => setNewService({ ...newService, nome: e.target.value })} placeholder="Ex: Manutenção Preventiva" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Preço Base (MT)</Label>
                                <Input type="number" value={newService.preco_base} onChange={e => setNewService({ ...newService, preco_base: e.target.value })} placeholder="0.00" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Descrição</Label>
                                <Textarea value={newService.descricao} onChange={e => setNewService({ ...newService, descricao: e.target.value })} placeholder="Detalhes do serviço..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} className="bg-indigo-600 w-full">Gravar Serviço</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Serviço</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Preço Base</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-10">Carregando...</TableCell></TableRow>
                        ) : servicos.map(s => (
                            <TableRow key={s.id}>
                                <TableCell className="font-bold">{s.nome}</TableCell>
                                <TableCell className="text-slate-500 text-sm">{s.descricao}</TableCell>
                                <TableCell className="font-mono">{new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(s.preco_base)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="text-red-400"><Trash2 size={16} /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
