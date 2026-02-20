'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileSignature, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
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
import { TermoCompromissoDocument } from '@/components/TermoCompromissoDocument'
import { Download } from 'lucide-react'

import Link from 'next/link'

export default function ContratosPage() {
    const [contratos, setContratos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTermo, setSelectedTermo] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchContratos()
    }, [])

    const fetchContratos = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('contratos')
            .select('*, clientes(nome), colaboradores(*)')
            .order('created_at', { ascending: false })

        if (error) toast.error('Erro ao carregar contratos')
        else setContratos(data || [])
        setLoading(false)
    }

    const handlePrint = () => {
        window.print()
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem a certeza que deseja APAGAR este contrato? Esta acção não pode ser desfeita.')) return

        const { error } = await supabase
            .from('contratos')
            .delete()
            .eq('id', id)

        if (error) toast.error('Erro ao apagar: ' + error.message)
        else {
            toast.success('Contrato apagado com sucesso!')
            fetchContratos()
        }
    }

    const getTipoBadge = (tipo: string) => {
        switch (tipo) {
            case 'fornecedor_cliente': return <Badge variant="secondary">Cliente</Badge>
            case 'termo_compromisso': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Termo de Comp.</Badge>
            case 'incubadora_prestador': return <Badge variant="outline">Prestador</Badge>
            default: return <Badge variant="outline">Compromisso</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Contratos & Acordos</h2>
                    <p className="text-slate-500">Gestão de acordos legais e compromissos de trabalho.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/master/contratos/novo-termo">
                        <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                            <FileSignature className="mr-2 h-4 w-4" /> Novo Termo de Comp.
                        </Button>
                    </Link>
                    <Button className="bg-primary">
                        <Plus className="mr-2 h-4 w-4" /> Novo Contrato
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Parte Relacionada</TableHead>
                            <TableHead>Vigência</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acções</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-10">Carregando...</TableCell></TableRow>
                        ) : contratos.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400">Nenhum contrato registado.</TableCell></TableRow>
                        ) : contratos.map(contrato => (
                            <TableRow key={contrato.id}>
                                <TableCell className="font-mono text-xs font-bold">{contrato.numero}</TableCell>
                                <TableCell>{getTipoBadge(contrato.tipo)}</TableCell>
                                <TableCell>
                                    {contrato.tipo === 'fornecedor_cliente' ? contrato.clientes?.nome : contrato.colaboradores?.nome}
                                </TableCell>
                                <TableCell className="text-xs">
                                    {new Date(contrato.data_inicio).toLocaleDateString()} a {contrato.data_fim ? new Date(contrato.data_fim).toLocaleDateString() : 'Indet.'}
                                </TableCell>
                                <TableCell className="font-bold">
                                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(contrato.valor || 0)}
                                </TableCell>
                                <TableCell>
                                    {contrato.estado === 'activo' ? (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Activo</Badge>
                                    ) : (
                                        <Badge variant="outline">{contrato.estado}</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-[10px]"
                                            onClick={() => setSelectedTermo(contrato)}
                                        >
                                            Ver Documento
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(contrato.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Document View For Printing/Download */}
            {selectedTermo && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white no-print-backdrop">
                    <div className="relative max-w-[850px] w-full my-8">
                        <div className="absolute -top-12 right-0 flex gap-4 no-print text-white">
                            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" onClick={() => setSelectedTermo(null)}>Fechar</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={handlePrint}>
                                <Download className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF
                            </Button>
                        </div>
                        <div className="bg-white rounded-lg shadow-2xl print:shadow-none overflow-hidden">
                            <TermoCompromissoDocument
                                id={selectedTermo.id}
                                colaborador={selectedTermo.colaboradores}
                                descricao={selectedTermo.descricao}
                                valor={selectedTermo.valor}
                                data={selectedTermo.created_at}
                                assinado={selectedTermo.estado === 'activo'}
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
