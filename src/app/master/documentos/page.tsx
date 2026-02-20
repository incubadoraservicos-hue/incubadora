'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Upload,
    File,
    Users,
    Clock,
    CheckCircle2,
    Eye
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function DocumentosExternosPage() {
    const [docs, setDocs] = useState<any[]>([])
    const [colaboradores, setColaboradores] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isNewOpen, setIsNewOpen] = useState(false)
    const supabase = createClient()

    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        ficheiro_url: 'https://example.com/placeholder.pdf', // Placeholder
        tipo_ficheiro: 'pdf',
        colaborador_ids: [] as string[]
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const [docsRes, colabRes] = await Promise.all([
            supabase.from('documentos_externos').select('*').order('created_at', { ascending: false }),
            supabase.from('colaboradores').select('id, nome').eq('estado', 'activo')
        ])

        if (docsRes.data) setDocs(docsRes.data)
        if (colabRes.data) setColaboradores(colabRes.data)
        setLoading(false)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        const { data: docData, error: docError } = await supabase
            .from('documentos_externos')
            .insert([{
                titulo: formData.titulo,
                descricao: formData.descricao,
                ficheiro_url: formData.ficheiro_url,
                tipo_ficheiro: formData.tipo_ficheiro
            }])
            .select()

        if (docError) {
            toast.error('Erro ao criar documento')
            return
        }

        if (formData.colaborador_ids.length > 0) {
            const pivotData = formData.colaborador_ids.map(id => ({
                documento_id: docData[0].id,
                colaborador_id: id
            }))
            await supabase.from('documentos_destinatarios').insert(pivotData)
        }

        toast.success('Documento partilhado!')
        setIsNewOpen(false)
        setFormData({ titulo: '', descricao: '', ficheiro_url: '', tipo_ficheiro: 'pdf', colaborador_ids: [] })
        fetchData()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Documentos Externos</h2>
                    <p className="text-slate-500">Partilha de ficheiros e acuse de recepção.</p>
                </div>

                <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-800 hover:bg-slate-900">
                            <Upload className="mr-2 h-4 w-4" /> Partilhar Documento
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Partilhar Documento</DialogTitle>
                                <DialogDescription>Carregue um ficheiro para partilhar com os colaboradores.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Título do Documento</Label>
                                    <Input value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Descrição</Label>
                                    <Textarea value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Destinatário (Opcional)</Label>
                                    <Select onValueChange={v => setFormData({ ...formData, colaborador_ids: [v] })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Escolha um colaborador" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {colaboradores.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Simular Upload (URL)</Label>
                                    <Input value={formData.ficheiro_url} onChange={e => setFormData({ ...formData, ficheiro_url: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Partilhar Agora</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {loading ? (
                    <p>Carregando...</p>
                ) : docs.length === 0 ? (
                    <p className="text-slate-400">Nenhum documento partilhado.</p>
                ) : docs.map(doc => (
                    <Card key={doc.id} className="border-none shadow-sm group">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                                    <File size={20} />
                                </div>
                                <Badge variant="outline" className="text-[10px]">{doc.tipo_ficheiro || 'PDF'}</Badge>
                            </div>
                            <CardTitle className="text-sm font-bold mt-4 line-clamp-1">{doc.titulo}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">{doc.descricao || 'Sem descrição.'}</p>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex -space-x-2">
                                    <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-200" />
                                    <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-300" />
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 text-xs">
                                    <Eye size={12} className="mr-1" /> Detalhes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
