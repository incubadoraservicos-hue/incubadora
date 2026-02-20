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
import { Plus, UserCheck, ShieldCheck, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

export default function ColaboradoresPage() {
    const [colaboradores, setColaboradores] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isNewOpen, setIsNewOpen] = useState(false)
    const supabase = createClient()

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        bi_passaporte: '',
        especialidades: [] as string[],
    })

    const especialidadesOpcoes = [
        'Manutenção', 'Formação', 'Assistência Técnica', 'Desenvolvimento', 'Design'
    ]

    useEffect(() => {
        fetchColaboradores()
    }, [])

    const fetchColaboradores = async () => {
        setLoading(true)
        const { data, error } = await supabase.from('colaboradores').select('*').order('nome')
        if (error) toast.error('Erro ao carregar colaboradores')
        else setColaboradores(data || [])
        setLoading(false)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.from('colaboradores').insert([formData])
        if (error) toast.error('Erro: ' + error.message)
        else {
            toast.success('Colaborador registado!')
            setIsNewOpen(false)
            setFormData({ nome: '', email: '', telefone: '', bi_passaporte: '', especialidades: [] })
            fetchColaboradores()
        }
    }

    const toggleEspecialidade = (esp: string) => {
        setFormData(prev => ({
            ...prev,
            especialidades: prev.especialidades.includes(esp)
                ? prev.especialidades.filter(e => e !== esp)
                : [...prev.especialidades, esp]
        }))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Colaboradores</h2>
                    <p className="text-slate-500">Rede de profissionais e técnicos externos.</p>
                </div>

                <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Novo Colaborador</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Registar Colaborador</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Nome Completo</Label>
                                    <Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>E-mail</Label>
                                        <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Telefone</Label>
                                        <Input value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>BI / Passaporte</Label>
                                    <Input value={formData.bi_passaporte} onChange={e => setFormData({ ...formData, bi_passaporte: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Especialidades</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {especialidadesOpcoes.map(esp => (
                                            <div key={esp} className="flex items-center space-x-2">
                                                <Checkbox id={esp} checked={formData.especialidades.includes(esp)} onCheckedChange={() => toggleEspecialidade(esp)} />
                                                <Label htmlFor={esp} className="text-xs font-normal cursor-pointer">{esp}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Guardar Colaborador</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Especialidades</TableHead>
                            <TableHead>Termo Sigilo</TableHead>
                            <TableHead>Saldo Pendente</TableHead>
                            <TableHead className="text-right">Acções</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-10">Carregando...</TableCell></TableRow>
                        ) : colaboradores.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-10">Nenhum colaborador registado.</TableCell></TableRow>
                        ) : colaboradores.map(colab => (
                            <TableRow key={colab.id}>
                                <TableCell>
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 font-bold text-xs uppercase">
                                            {colab.nome.substring(0, 2)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{colab.nome}</span>
                                            <span className="text-[10px] text-slate-500">{colab.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {colab.especialidades?.map((e: string) => (
                                            <Badge key={e} variant="outline" className="text-[10px] px-1 py-0">{e}</Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {colab.termo_sigilo_assinado ? (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                            <ShieldCheck size={12} className="mr-1" /> Assinado
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-slate-400">Pendente</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="font-bold">
                                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(colab.saldo_pendente || 0)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Ver Perfil</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
