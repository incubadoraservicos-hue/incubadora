'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, MoreHorizontal, User } from 'lucide-react'
import { toast } from 'sonner'

export default function ClientesPage() {
    const [clientes, setClientes] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isNewClientOpen, setIsNewClientOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    // New client form state
    const [formData, setFormData] = useState({
        nome: '',
        nuit: '',
        email: '',
        telefone: '',
        endereco: '',
    })

    useEffect(() => {
        fetchClientes()
    }, [])

    const fetchClientes = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Erro ao carregar clientes')
        } else {
            setClientes(data || [])
        }
        setLoading(false)
    }

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.from('clientes').insert([formData])

        if (error) {
            toast.error('Erro ao criar cliente: ' + error.message)
        } else {
            toast.success('Cliente criado com sucesso')
            setIsNewClientOpen(false)
            setFormData({ nome: '', nuit: '', email: '', telefone: '', endereco: '' })
            fetchClientes()
        }
    }

    const filteredClientes = clientes.filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nuit?.includes(searchTerm)
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Clientes</h2>
                    <p className="text-slate-500">Gerencie o cadastro de clientes da plataforma.</p>
                </div>

                <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-semibold shadow-sm transition-all hover:scale-105">
                            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleCreateClient}>
                            <DialogHeader>
                                <DialogTitle>Adicionar Cliente</DialogTitle>
                                <DialogDescription>
                                    Preencha os dados fiscais e de contacto do novo cliente.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nome">Nome / Razão Social</Label>
                                    <Input
                                        id="nome"
                                        value={formData.nome}
                                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="nuit">NUIT</Label>
                                        <Input
                                            id="nuit"
                                            value={formData.nuit}
                                            onChange={e => setFormData({ ...formData, nuit: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="telefone">Telefone</Label>
                                        <Input
                                            id="telefone"
                                            value={formData.telefone}
                                            onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="endereco">Morada</Label>
                                    <Input
                                        id="endereco"
                                        value={formData.endereco}
                                        onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsNewClientOpen(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Cliente</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Pesquisar por nome ou NUIT..."
                            className="pl-10 bg-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="font-bold">Cliente</TableHead>
                                <TableHead className="font-bold">NUIT</TableHead>
                                <TableHead className="font-bold">Contacto</TableHead>
                                <TableHead className="font-bold text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                                        A carregar clientes...
                                    </TableCell>
                                </TableRow>
                            ) : filteredClientes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                                        Nenhum cliente encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClientes.map((cliente) => (
                                    <TableRow key={cliente.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 text-slate-600">
                                                    <User size={16} />
                                                </div>
                                                <span className="font-medium text-slate-900">{cliente.nome}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 font-mono text-xs">{cliente.nuit || '---'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs">
                                                <span className="text-slate-900">{cliente.email || '---'}</span>
                                                <span className="text-slate-500">{cliente.telefone || '---'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
