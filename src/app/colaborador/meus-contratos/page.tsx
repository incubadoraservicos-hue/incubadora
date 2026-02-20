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
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user

        if (!user) {
            console.error('Nenhuma sessão activa encontrada')
            toast.error('Sessão expirada. Por favor, faça login novamente.')
            setLoading(false)
            return
        }

        console.log('Utilizador Logado:', user.email, 'ID:', user.id)

        // Tenta encontrar o colaborador por email ou pelo user_id do Auth
        const { data: colab, error: colabError } = await supabase
            .from('colaboradores')
            .select('id, nome')
            .or(`email.eq.${user.email},user_id.eq.${user.id}`)
            .maybeSingle()

        if (!colab) {
            console.error('Colaborador não encontrado para:', user.email)
            toast.error('Não foi possível encontrar o seu perfil de colaborador.')
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('contratos')
            .select('*, colaboradores(*)')
            .eq('colaborador_id', colab.id)
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Erro ao carregar acordos: ' + error.message)
        } else {
            setContratos(data || [])
        }

        setLoading(false)
    }

    const handleAction = async (id: string, action: 'aceite' | 'rejeitado') => {
        const { error } = await supabase
            .from('contratos')
            .update({ estado: action })
            .eq('id', id)

        if (error) toast.error('Erro ao processar acção')
        else {
            toast.success(action === 'aceite' ? 'Acordo assinado com sucesso!' : 'Acordo rejeitado.')

            // Se aceitou, mantém aberto para ele ver o selo e poder baixar/imprimir
            // Senão, fecha.
            if (action === 'rejeitado') setSelectedTermo(null)
            else {
                // Atualiza o estado do termo selecionado localmente para mostrar o selo
                setSelectedTermo(prev => ({ ...prev, estado: 'aceite' }))
            }
            fetchContratos()
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between no-print px-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#002B5B]">Meus Acordos</h2>
                    <p className="text-slate-500 text-sm">Analise, aceite ou recuse os seus termos de compromisso.</p>
                </div>
            </div>

            <div className="grid gap-4 no-print px-4">
                {loading ? (
                    <div className="py-20 text-center text-slate-400">Carregando acordos...</div>
                ) : contratos.length === 0 ? (
                    <Card className="border-dashed border-2 flex items-center justify-center py-20 grayscale opacity-50">
                        <div className="text-center">
                            <FileSignature size={40} className="mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">Não existem acordos pendentes.</p>
                        </div>
                    </Card>
                ) : contratos.map(item => (
                    <Card key={item.id} className="border-none shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTermo(item)}>
                        <div className={`w-2 h-full ${item.estado === 'pendente' ? 'bg-amber-400' : item.estado === 'aceite' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        <div className="flex-1 p-5">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] font-bold text-slate-400">{item.numero}</span>
                                        <Badge variant="outline" className={`text-[10px] border-none ${item.estado === 'pendente' ? 'bg-amber-50 text-amber-700' :
                                                item.estado === 'aceite' ? 'bg-emerald-50 text-emerald-700' :
                                                    'bg-red-50 text-red-700'
                                            }`}>
                                            {item.estado === 'pendente' ? 'Pendente de Assinatura' :
                                                item.estado === 'aceite' ? 'Contrato Aceite' : 'Recusado'}
                                        </Badge>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-800 uppercase">{item.descricao}</h3>
                                    <p className="text-[10px] text-slate-400">Recebido em: {new Date(item.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-[#002B5B]">
                                        {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(item.valor)}
                                    </p>
                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] text-indigo-600 mt-2">
                                        Clique para Abrir
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* FULL SCREEN DOCUMENT VIEWER */}
            {selectedTermo && (
                <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col no-print-backdrop overflow-hidden">
                    {/* FIXED HEADER WITH ACTIONS */}
                    <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm no-print">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" onClick={() => setSelectedTermo(null)}>
                                <XCircle className="mr-2 h-4 w-4" /> Fechar Visualizador
                            </Button>
                            <div className="h-6 w-[1px] bg-slate-200 ml-2"></div>
                            <span className="text-sm font-bold text-slate-600 hidden md:inline">Documento: {selectedTermo.numero}</span>
                        </div>

                        <div className="flex gap-2">
                            {selectedTermo.estado === 'pendente' ? (
                                <>
                                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction(selectedTermo.id, 'rejeitado')}>
                                        <XCircle className="mr-2 h-4 w-4" /> Recusar Acordo
                                    </Button>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8" onClick={() => handleAction(selectedTermo.id, 'aceite')}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Concordo e Assino Digitalmente
                                    </Button>
                                </>
                            ) : (
                                <Button className="bg-[#002B5B] hover:bg-slate-800" onClick={handlePrint}>
                                    <Download className="mr-2 h-4 w-4" /> Salvar em PDF / Imprimir
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* SCROLLABLE DOCUMENT AREA */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-12 flex justify-center bg-slate-100">
                        <div className="bg-white shadow-2xl rounded-sm w-full max-w-[850px] print:shadow-none print:w-full print:max-w-none">
                            <TermoCompromissoDocument
                                id={selectedTermo.id}
                                colaborador={selectedTermo.colaboradores}
                                descricao={selectedTermo.descricao}
                                valor={selectedTermo.valor}
                                data={selectedTermo.created_at}
                                assinado={selectedTermo.estado === 'aceite'}
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
