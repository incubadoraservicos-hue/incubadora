'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, FileSignature } from 'lucide-react'
import { toast } from 'sonner'

export default function NovoTermoPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const osIdParam = searchParams.get('os_id')
    const supabase = createClient()
    const [colaboradores, setColaboradores] = useState<any[]>([])
    const [ordensServico, setOrdensServico] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        colaborador_id: '',
        ordem_servico_id: '',
        cliente_id: '',
        descricao: '',
        valor: '',
        data_inicio: new Date().toISOString().split('T')[0],
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const [colabRes, osRes] = await Promise.all([
            supabase.from('colaboradores').select('id, nome').eq('estado', 'activo'),
            supabase.from('ordens_servico').select('id, numero, descricao, valor, colaborador_id, cliente_id').order('created_at', { ascending: false })
        ])

        if (colabRes.data) setColaboradores(colabRes.data)

        if (osRes.data) {
            setOrdensServico(osRes.data)

            // Auto-seleccionar se vier ID na URL
            if (osIdParam) {
                const os = osRes.data.find(o => o.id === osIdParam)
                if (os) {
                    setFormData(prev => ({
                        ...prev,
                        ordem_servico_id: os.id,
                        colaborador_id: os.colaborador_id,
                        cliente_id: os.cliente_id,
                        descricao: os.descricao,
                        valor: os.valor.toString()
                    }))
                }
            }
        }
    }

    const handleSelectOS = (osId: string) => {
        const os = ordensServico.find(o => o.id === osId)
        if (os) {
            setFormData({
                ...formData,
                ordem_servico_id: osId,
                colaborador_id: os.colaborador_id,
                cliente_id: os.cliente_id,
                descricao: os.descricao,
                valor: os.valor.toString()
            })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const numero = `TC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

            const { error } = await supabase.from('contratos').insert([{
                ...formData,
                valor: parseFloat(formData.valor),
                ordem_servico_id: formData.ordem_servico_id === 'manual' ? null : formData.ordem_servico_id,
                numero,
                tipo: 'termo_compromisso',
                estado: 'pendente'
            }])

            if (error) throw error

            toast.success('Termo de Compromisso enviado para o colaborador!')
            router.push('/master/contratos')
        } catch (error: any) {
            toast.error('Erro ao criar termo: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h2 className="text-3xl font-bold tracking-tight">Novo Termo de Compromisso</h2>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6">
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Dados do Acordo</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-blue-600 font-bold">Vincular a uma Missão (OS)</Label>
                                <Select onValueChange={handleSelectOS} value={formData.ordem_servico_id}>
                                    <SelectTrigger className="bg-blue-50 border-blue-100">
                                        <SelectValue placeholder="Escolha a missão..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Nenhuma (Manual)</SelectItem>
                                        {ordensServico.map(o => (
                                            <SelectItem key={o.id} value={o.id}>{o.numero} - {o.descricao.substring(0, 30)}...</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Colaborador</Label>
                                <Select onValueChange={v => setFormData({ ...formData, colaborador_id: v })} value={formData.colaborador_id} required>
                                    <SelectTrigger className="bg-slate-50">
                                        <SelectValue placeholder="Seleccione o colaborador" />
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
                            <Label>Descrição do Trabalho / Missão</Label>
                            <Textarea
                                placeholder="Descreva detalhadamente as actividades que o colaborador irá executar..."
                                className="bg-slate-50 min-h-[150px]"
                                value={formData.descricao}
                                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Valor do Pagamento (MT)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="bg-slate-50"
                                    value={formData.valor}
                                    onChange={e => setFormData({ ...formData, valor: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Data de Emissão</Label>
                                <Input
                                    type="date"
                                    className="bg-slate-50"
                                    value={formData.data_inicio}
                                    onChange={e => setFormData({ ...formData, data_inicio: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3">
                            <div className="bg-amber-100 p-2 rounded-full h-fit mt-1">
                                <FileSignature className="text-amber-700 h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900">Nota sobre o Sigilo</p>
                                <p className="text-xs text-amber-700 mt-1">
                                    Este documento inclui automaticamente a cláusula de sigilo absoluto da Incubadora de Soluções.
                                    O colaborador deverá aceitar os termos através do seu painel privado.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                        {loading ? 'A processar...' : <><Save className="mr-2 h-4 w-4" /> Enviar para Aprovação</>}
                    </Button>
                </div>
            </form>
        </div>
    )
}
