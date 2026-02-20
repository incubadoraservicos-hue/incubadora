'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, History, ArrowDownToLine, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

export default function ColaboradorSaldoPage() {
    const [colab, setColab] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase
                .from('colaboradores')
                .select('*')
                .eq('user_id', user.id)
                .single()

            setColab(data)
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Meu Saldo</h2>
                <p className="text-slate-500">Acompanhe os seus ganhos e pagamentos recebidos.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-none shadow-sm bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet size={80} />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium opacity-70">Saldo Pendente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(colab?.saldo_pendente || 0)}
                        </div>
                        <p className="text-[10px] mt-2 text-slate-400">Pronto para ser liquidado pelo Master após conclusão de serviços.</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Histórico Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold italic">0,00 MT</div>
                        <div className="flex items-center text-xs text-green-600 mt-1">
                            <TrendingUp size={12} className="mr-1" /> Ganhos acumulados
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-lg">Pagamentos Recentes</CardTitle>
                </CardHeader>
                <CardContent className="h-40 flex flex-col items-center justify-center text-slate-400">
                    <History size={32} className="mb-2 opacity-20" />
                    <p className="text-sm">Ainda não foram processados pagamentos.</p>
                </CardContent>
            </Card>
        </div>
    )
}
