'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSignature, CheckCircle2, XCircle, Download, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { TermoCompromissoDocument } from '@/components/TermoCompromissoDocument'

export default function MeusContratosPage() {
    const [contratos, setContratos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTermo, setSelectedTermo] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchContratos()
    }, [])

    const fetchContratos = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data: colab } = await supabase.from('colaboradores').select('id, nome, nuit').eq('email', user.email).single()

            if (colab) {
                const { data, error } = await supabase
                    .from('contratos')
                    .select('*, colaboradores(*)')
                    .eq('colaborador_id', colab.id)
                    .eq('tipo', 'termo_compromisso')
                    .order('created_at', { ascending: false })

                if (error) toast.error('Erro ao carregar acordos')
                else setContratos(data || [])
            }
        }
        setLoading(false)
    }

    const handleAction = async (id: string, action: 'activo' | 'rejeitado') => {
        const { error } = await supabase
            .from('contratos')
            .update({ estado: action })
            .eq('id', id)

        if (error) toast.error('Erro ao processar acção')
        else {
            toast.success(action === 'activo' ? 'Acordo assinado com sucesso!' : 'Acordo rejeitado.')
            fetchContratos()
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between no-print">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Meus Acordos</h2>
                    <p className="text-slate-500">Termos de compromisso e contratos de parceria.</p>
                </div>
            </div>

            <div className="grid gap-6 no-print">
                {loading ? (
                    <p>Carregando...</p>
                ) : contratos.length === 0 ? (
                    <Card className="border-dashed border-2 flex items-center justify-center py-20 grayscale opacity-50">
                        <div className="text-center">
                            <FileSignature size={40} className="mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">Não existem acordos pendentes.</p>
                        </div>
                    </Card>
                ) : contratos.map(item => (
                    <Card key={item.id} className="border-none shadow-sm overflow-hidden flex flex-col md:flex-row">
                        <div className={`w-2 h-full ${item.estado === 'pendente' ? 'bg-amber-400' : item.estado === 'activo' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        <div className="flex-1 p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-xs font-bold text-slate-400">{item.numero}</span>
                                        {item.estado === 'pendente' && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Pendente de Assinatura</Badge>}
                                        {item.estado === 'activo' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Assinado Digitalmente</Badge>}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{item.descricao}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">Valor Acordado</p>
                                    <p className="text-xl font-bold text-[#002B5B]">
                                        {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(item.valor)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between items-center">
                                <div className="text-xs text-slate-500">
                                    Emitido em: {new Date(item.created_at).toLocaleDateString()}
                                </div>
                                <div className="flex gap-2">
                                    {item.estado === 'pendente' ? (
                                        <>
                                            <Button variant="outline" className="text-red-600 hover:bg-red-50 border-red-100" onClick={() => handleAction(item.id, 'rejeitado')}>
                                                <XCircle className="mr-2 h-4 w-4" /> Recusar
                                            </Button>
                                            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleAction(item.id, 'activo')}>
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Analisar e Assinar
                                            </Button>
                                        </>
                                    ) : item.estado === 'activo' ? (
                                        <Button variant="outline" onClick={() => setSelectedTermo(item)}>
                                            <Download className="mr-2 h-4 w-4" /> Baixar Documento Assinado
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Document View For Printing/Download */}
            {selectedTermo && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white no-print-backdrop">
                    <div className="relative max-w-[850px] w-full">
                        <div className="absolute -top-12 right-0 flex gap-4 no-print text-white">
                            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" onClick={() => setSelectedTermo(null)}>Fechar</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handlePrint}>
                                <Download className="mr-2 h-4 w-4" /> Imprimir / PDF
                            </Button>
                        </div>
                        <div className="bg-white rounded-lg shadow-2xl print:shadow-none">
                            <TermoCompromissoDocument
                                colaborador={selectedTermo.colaboradores}
                                descricao={selectedTermo.descricao}
                                valor={selectedTermo.valor}
                                data={selectedTermo.created_at}
                                assinado={true}
                            />
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #termo-print, #termo-print * { visibility: visible; }
          #termo-print { position: absolute; left: 0; top: 0; width: 100%; border: none; shadow: none; }
          .no-print { display: none !important; }
        }
      `}</style>
        </div>
    )
}
