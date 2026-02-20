'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { File, Download, Search, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ColaboradorDocumentosPage() {
    const [docs, setDocs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchMyDocs()
    }, [])

    const fetchMyDocs = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            // In a real scenario we join with pivot table
            const { data } = await supabase
                .from('documentos_externos')
                .select('*')

            setDocs(data || [])
        }
        setLoading(false)
    }

    const handleAck = async (id: string) => {
        toast.success('Acuse de recepção registado!')
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Meus Documentos</h2>
                <p className="text-slate-500">Documentos partilhados pelo Master para seu conhecimento.</p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Pesquisar documentos..." className="pl-10 h-9" />
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <p>Carregando...</p>
                ) : docs.length === 0 ? (
                    <p className="text-slate-500">Nenhum documento disponível.</p>
                ) : docs.map(doc => (
                    <Card key={doc.id} className="border-none shadow-sm hover:bg-slate-50/30 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center text-slate-500 mr-4">
                                    <File size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{doc.titulo}</h3>
                                    <div className="text-[10px] text-slate-500 flex items-center mt-1">
                                        {new Date(doc.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" size="sm" className="h-8 text-xs">
                                    <Download size={12} className="mr-2" /> Download
                                </Button>
                                <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAck(doc.id)}>
                                    <CheckCircle2 size={12} className="mr-2" /> Tomei Conhecimento
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
