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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Monitor, Box, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function SistemasPage() {
    const [sistemas, setSistemas] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isNewOpen, setIsNewOpen] = useState(false)
    const supabase = createClient()

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        versao: '1.0.0',
        tipo_licenca: 'mensal',
        valor_base: '',
    })

    useEffect(() => {
        fetchSistemas()
    }, [])

    const fetchSistemas = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('sistemas')
            .select('*')
            .order('nome')

        if (error) toast.error('Erro ao carregar sistemas')
        else setSistemas(data || [])
        setLoading(false)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.from('sistemas').insert([
            { ...formData, valor_base: parseFloat(formData.valor_base) }
        ])

        if (error) toast.error('Erro: ' + error.message)
        else {
            toast.success('Sistema registado!')
            setIsNewOpen(false)
            setFormData({ nome: '', descricao: '', versao: '1.0.0', tipo_licenca: 'mensal', valor_base: '' })
            fetchSistemas()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Sistemas SaaS</h2>
                    <p className="text-slate-500">Catálogo de produtos e soluções activas.</p>
                </div>

                <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Novo Sistema</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Registar Novo Sistema</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Nome do Sistema</Label>
                                    <Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Descrição</Label>
                                    <Textarea value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Versão</Label>
                                        <Input value={formData.versao} onChange={e => setFormData({ ...formData, versao: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Tipo de Licença</Label>
                                        <Select onValueChange={v => setFormData({ ...formData, tipo_licenca: v })} defaultValue="mensal">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="mensal">Mensal</SelectItem>
                                                <SelectItem value="anual">Anual</SelectItem>
                                                <SelectItem value="unico">Pagamento Único</SelectItem>
                                                <SelectItem value="projecto">Projecto</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Valor Base (MT)</Label>
                                    <Input type="number" step="0.01" value={formData.valor_base} onChange={e => setFormData({ ...formData, valor_base: e.target.value })} required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Guardar Sistema</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <p>A carregar...</p>
                ) : sistemas.length === 0 ? (
                    <p>Nenhum sistema cadastrado.</p>
                ) : sistemas.map(sistema => (
                    <Card key={sistema.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-bold">{sistema.nome}</CardTitle>
                            <Monitor className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-slate-500 mb-2 truncate">{sistema.descricao}</div>
                            <div className="flex items-center justify-between mt-4">
                                <Badge variant="secondary">{sistema.tipo_licenca}</Badge>
                                <div className="font-bold text-primary">
                                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(sistema.valor_base)}
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-4 flex items-center">
                                <Box size={10} className="mr-1" /> Versão {sistema.versao}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
