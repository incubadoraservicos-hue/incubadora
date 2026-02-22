'use client'

import Link from 'next/link'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    ClipboardList,
    Wallet,
    Clock,
    CheckCircle2,
    AlertCircle,
    Bell
} from 'lucide-react'
import { requestNotificationPermission } from '@/utils/firebase/notifications'
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
import { ReceiptModal } from '@/components/ReceiptModal'

export default function ColaboradorOSPage() {
    const [os, setOs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [reportText, setReportText] = useState('')
    const [selectedOS, setSelectedOS] = useState<any>(null)
    const [receiptOS, setReceiptOS] = useState<any>(null)
    const [colabId, setColabId] = useState<string | null>(null)
    const [colabName, setColabName] = useState<string>('')
    const [notifEnabled, setNotifEnabled] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchMyOS()
        // Verificar se já temos permissão
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotifEnabled(Notification.permission === 'granted')
        }
    }, [])

    const fetchMyOS = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            // Join with colaboradores to get proper ID and Name
            const { data: colab } = await supabase.from('colaboradores').select('id, nome').eq('email', user.email).single()

            if (colab) {
                setColabId(colab.id)
                setColabName(colab.nome)
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

    const handleEnableNotifications = async () => {
        if (!colabId) return
        const token = await requestNotificationPermission(colabId)
        if (token) {
            setNotifEnabled(true)
            toast.success('Notificações no telemóvel activadas!')
        } else {
            toast.error('Não foi possível activar as notificações. Verifique as definições do seu navegador.')
        }
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#002B5B]">
                        Olá, {colabName || 'Colaborador'}
                    </h2>
                    <p className="text-slate-500 text-sm">Bem-vindo ao seu painel de Missões & Serviços.</p>
                </div>
                {!notifEnabled && (
                    <Button
                        onClick={handleEnableNotifications}
                        variant="outline"
                        className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                    >
                        <Bell className="mr-2 h-4 w-4 animate-bounce" />
                        Activar Notificações no Telemóvel
                    </Button>
                )}
                {notifEnabled && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 py-2">
                        <Bell className="mr-3 h-3 w-3" />
                        Notificações Activas
                    </Badge>
                )}
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

                            {item.revisao_master && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <div className="text-[10px] font-bold text-blue-600 uppercase mb-1 flex items-center">
                                        <AlertCircle size={10} className="mr-1" /> Revisão do Master
                                    </div>
                                    <p className="text-[11px] text-slate-700 italic">"{item.revisao_master}"</p>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 mt-6">
                                {item.estado === 'enviada' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs font-bold" onClick={() => handleAction(item.id, 'confirmada')}>
                                            Aceitar
                                        </Button>
                                        <Button variant="outline" className="text-red-600 hover:bg-red-50 h-8 text-xs" onClick={() => handleAction(item.id, 'rejeitada')}>
                                            Rejeitar
                                        </Button>
                                        <div className="col-span-2 mt-1">
                                            <Link href="/colaborador/documentos">
                                                <Button variant="ghost" className="w-full text-[10px] h-7 text-blue-600 bg-blue-50/50 border border-blue-100 hover:bg-blue-100">
                                                    Ver Termo de Compromisso
                                                </Button>
                                            </Link>
                                        </div>
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
                                    <div className={`w-full flex items-center justify-center p-2 rounded-md border text-[10px] font-bold ${item.revisao_master
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-50 text-slate-500 border-slate-100'
                                        }`}>
                                        {item.revisao_master ? (
                                            <><CheckCircle2 size={12} className="mr-2" /> Serviço Finalizado & Revisto</>
                                        ) : (
                                            <><Clock size={12} className="mr-2" /> Aguardando revisão do Master</>
                                        )}
                                    </div>
                                )}
                                {item.estado === 'paga' && (
                                    <Button
                                        variant="outline"
                                        className="w-full text-emerald-600 border-emerald-200 bg-emerald-50 h-8 text-xs font-bold"
                                        onClick={() => setReceiptOS(item)}
                                    >
                                        <Wallet size={14} className="mr-2" /> Baixar Comprovativo
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <ReceiptModal
                isOpen={!!receiptOS}
                onClose={() => setReceiptOS(null)}
                os={receiptOS}
            />
        </div>
    )
}
