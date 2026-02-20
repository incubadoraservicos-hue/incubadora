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

export default function DocumentosExternosPage() {
    const [docs, setDocs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchDocs()
    }, [])

    const fetchDocs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('documentos_externos')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) toast.error('Erro ao carregar documentos')
        else setDocs(data || [])
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Documentos Externos</h2>
                    <p className="text-slate-500">Partilha de ficheiros e acuse de recepção.</p>
                </div>
                <Button className="bg-slate-800 hover:bg-slate-900">
                    <Upload className="mr-2 h-4 w-4" /> Partilhar Documento
                </Button>
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
