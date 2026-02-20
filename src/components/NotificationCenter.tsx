'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Mail, Loader2, CheckCircle2, Bell } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function NotificationCenter() {
    const supabase = createClient()
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [showSuccess, setShowSuccess] = useState(false)
    const [lastMsg, setLastMsg] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        fetchNotifications()
        // Realtime subscription
        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notificacoes' },
                () => fetchNotifications()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('notificacoes')
            .select('*')
            .eq('user_id', user.id)
            .eq('lida', false)
            .order('created_at', { ascending: false })

        if (data) setNotifications(data)
    }

    const processNotification = async (notif: any) => {
        setProcessingId(notif.id)

        // Simular processamento (como solicitado pelo usuário)
        await new Promise(resolve => setTimeout(resolve, 2000))

        const { error } = await supabase
            .from('notificacoes')
            .update({ lida: true })
            .eq('id', notif.id)

        if (!error) {
            setLastMsg(notif.mensagem)
            setShowSuccess(true)
            fetchNotifications()
        }
        setProcessingId(null)
    }

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="relative text-slate-400">
                <Mail className="h-5 w-5" />
            </Button>
        )
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative group overflow-visible">
                        <Mail className={`h-5 w-5 ${notifications.length > 0 ? 'text-indigo-600 animate-bounce' : 'text-slate-400'}`} />
                        {notifications.length > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 border-2 border-white">
                                {notifications.length}
                            </Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-2 border-none shadow-xl bg-white/95 backdrop-blur-md">
                    <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center mb-2">
                        <span className="font-bold text-sm">Notificações</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{notifications.length} Novas</span>
                    </div>
                    {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm">
                            <Mail className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            Nenhuma mensagem nova.
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <DropdownMenuItem
                                key={n.id}
                                className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-slate-50 cursor-pointer mb-1 border border-transparent hover:border-indigo-100 transition-all"
                                onClick={() => processNotification(n)}
                            >
                                <div className="flex w-full justify-between items-start">
                                    <span className="font-bold text-xs text-indigo-600">{n.titulo}</span>
                                    <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{n.mensagem}</p>
                            </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Processing Dialog */}
            <Dialog open={!!processingId} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md border-none flex flex-col items-center py-10">
                    <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                    <p className="font-bold text-lg">A processar transacção...</p>
                    <p className="text-sm text-slate-500 italic">Sincronizando com o banco e actualizando conta.</p>
                </DialogContent>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                <DialogContent className="sm:max-w-md border-none flex flex-col items-center py-10">
                    <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 size={32} />
                    </div>
                    <p className="font-bold text-xl text-emerald-600">Sucesso!</p>
                    <p className="text-center text-slate-600 mt-2 px-6">
                        O valor foi correctamente adicionado ao seu saldo disponível.
                    </p>
                    <Button onClick={() => setShowSuccess(false)} className="mt-6 bg-slate-900 px-8">Fechar</Button>
                </DialogContent>
            </Dialog>
        </>
    )
}
