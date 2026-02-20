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

export default function ColaboradorOSPage() {
    const [os, setOs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchMyOS()
    }, [])

    const fetchMyOS = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data, error } = await supabase
                .from('ordens_servico')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) toast.error('Erro ao carregar os seus serviços')
            else setOs(data || [])
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
            toast.success('Estado actualizado!')
            fetchMyOS()
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Minhas Ordens de Serviço</h2>
                <p className="text-slate-500">Acompanhe e actualize o estado dos seus trabalhos.</p>
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
                    <Card key={item.id} className="border-none shadow-sm relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-1 h-full font-bold ${item.estado === 'enviada' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
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

                            <div className="grid grid-cols-2 gap-2 mt-6">
                                {item.estado === 'enviada' && (
                                    <Button className="col-span-full bg-indigo-600 hover:bg-indigo-700 h-8 text-xs" onClick={() => handleAction(item.id, 'confirmada')}>
                                        Confirmar Recepção
                                    </Button>
                                )}
                                {item.estado === 'confirmada' && (
                                    <Button className="col-span-full bg-orange-500 hover:bg-orange-600 h-8 text-xs text-white" onClick={() => handleAction(item.id, 'em_execucao')}>
                                        Começar Execução
                                    </Button>
                                )}
                                {item.estado === 'em_execucao' && (
                                    <Button className="col-span-full bg-purple-600 hover:bg-purple-700 h-8 text-xs" onClick={() => handleAction(item.id, 'concluida')}>
                                        Marcar como Concluído
                                    </Button>
                                )}
                                {item.estado === 'concluida' && (
                                    <div className="col-span-full flex items-center justify-center p-2 bg-slate-50 text-slate-500 text-[10px] rounded-md">
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
