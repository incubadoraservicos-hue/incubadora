'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    ClipboardList,
    Wallet,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function ColaboradorOSPage() {
    const [os, setOs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [reportText, setReportText] = useState('')
    const [selectedOS, setSelectedOS] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchMyOS()
    }, [])

    const fetchMyOS = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            // Join with colaboradores to get proper ID
            const { data: colab } = await supabase.from('colaboradores').select('id').eq('email', user.email).single()

            if (colab) {
                const { data, error } = await supabase
                    .from('ordens_servico')
                    .select('*')
                    .eq('colaborador_id', colab.id)
                    .order('created_at', { ascending: false })

                if (error) toast.error('Erro ao carregar os seus serviços')
                else setOs(data || [])
            }
        }
        setLoading(false)
    }

    const handleAction = async (id: string, nextStatus: string) => {
        const { error } = await supabase
            .from('ordens_servico')
            .update({ estado: nextStatus })
            .eq('id', id)

        if (error) toast.error('Erro ao actualizar estado')
        else {
            toast.success(nextStatus === 'rejeitada' ? 'Serviço rejeitado' : 'Estado actualizado!')
            fetchMyOS()
        }
    }

    const handleSendReport = async () => {
        if (!selectedOS) return
        const { error } = await supabase
            .from('ordens_servico')
            .update({ relatorio: reportText, estado: 'concluida' })
            .eq('id', selectedOS.id)

        if (error) toast.error('Erro ao enviar relatório')
        else {
            toast.success('Relatório enviado e serviço concluído!')
            setSelectedOS(null)
            setReportText('')
            fetchMyOS()
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Minhas Missões & Serviços</h2>
                <p className="text-slate-500">Aceite novos desafios e reporte o seu progresso.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <p>Carregando...</p>
                ) : os.length === 0 ? (
                    <Card className="col-span-full border-dashed border-2 flex items-center justify-center py-20 grayscale opacity-50">
                        <div className="text-center">
                            <ClipboardList size={40} className="mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">Ainda não recebeu ordens de serviço.</p>
                        </div>
                    </Card>
                ) : os.map(item => (
                    <Card key={item.id} className="border-none shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className={`absolute top-0 left-0 w-1 h-full font-bold ${item.estado === 'enviada' ? 'bg-indigo-500' :
                                item.estado === 'rejeitada' ? 'bg-red-500' :
                                    'bg-emerald-500'
                            }`} />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <span className="font-mono text-[10px] font-bold text-slate-400">{item.numero}</span>
                                <Badge variant={item.estado === 'paga' ? 'default' : 'secondary'} className="text-[10px]">
                                    {item.estado.toUpperCase()}
                                </Badge>
                            </div>
                            <CardTitle className="text-sm mt-2">{item.descricao}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end mt-4">
                                <div className="text-xs text-slate-500 italic">Prazo: {item.prazo ? new Date(item.prazo).toLocaleDateString() : '---'}</div>
                                <div className="text-lg font-bold text-slate-900">
                                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(item.valor)}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 mt-6">
                                {item.estado === 'enviada' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs" onClick={() => handleAction(item.id, 'confirmada')}>
                                            Aceitar
                                        </Button>
                                        <Button variant="outline" className="text-red-600 hover:bg-red-50 h-8 text-xs" onClick={() => handleAction(item.id, 'rejeitada')}>
                                            Rejeitar
                                        </Button>
                                    </div>
                                )}
                                {item.estado === 'confirmada' && (
                                    <Button className="w-full bg-orange-500 hover:bg-orange-600 h-8 text-xs text-white" onClick={() => handleAction(item.id, 'em_execucao')}>
                                        Começar Execução
                                    </Button>
                                )}
                                {item.estado === 'em_execucao' && (
                                    <Dialog open={selectedOS?.id === item.id} onOpenChange={(open) => setSelectedOS(open ? item : null)}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full bg-purple-600 hover:bg-purple-700 h-8 text-xs">
                                                Concluir & Reportar
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Relatório de Serviço</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label>Descreva o trabalho realizado</Label>
                                                    <Textarea
                                                        placeholder="Ex: Sistema instalado e testado com sucesso..."
                                                        value={reportText}
                                                        onChange={(e) => setReportText(e.target.value)}
                                                        rows={5}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleSendReport}>Enviar Relatório Final</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                                {item.estado === 'concluida' && (
                                    <div className="w-full flex items-center justify-center p-2 bg-slate-50 text-slate-500 text-[10px] rounded-md border border-slate-100">
                                        <Clock size={12} className="mr-2" /> Aguardando revisão do Master
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
