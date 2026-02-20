'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function FacturasPage() {
    const [facturas, setFacturas] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchFacturas()
    }, [])

    const fetchFacturas = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('facturas')
            .select('*, clientes(nome)')
            .order('numero', { ascending: false })

        if (error) toast.error('Erro ao carregar facturas')
        else setFacturas(data || [])
        setLoading(false)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paga': return <Badge className="bg-green-100 text-green-700 border-none">Paga</Badge>
            case 'atraso': return <Badge className="bg-red-100 text-red-700 border-none">Em Atraso</Badge>
            case 'emitida': return <Badge className="bg-blue-100 text-blue-700 border-none">Emitida</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Facturação</h2>
                    <p className="text-slate-500">Gestão de facturas, vencimentos e recebimentos.</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Nova Factura
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-blue-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-80">Total a Receber</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold italic">0,00 MT</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-green-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-80">Recebido (Mês)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold italic">0,00 MT</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-red-500 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-80">Vencido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold italic">0,00 MT</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Emissão</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Valor Total</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-10">Carregando...</TableCell></TableRow>
                        ) : facturas.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400">Nenhuma factura emitida ainda.</TableCell></TableRow>
                        ) : facturas.map(factura => (
                            <TableRow key={factura.id}>
                                <TableCell className="font-mono text-xs font-bold">{factura.numero}</TableCell>
                                <TableCell>{factura.clientes?.nome}</TableCell>
                                <TableCell className="text-xs">{new Date(factura.data_emissao).toLocaleDateString()}</TableCell>
                                <TableCell className="text-xs">{new Date(factura.data_vencimento).toLocaleDateString()}</TableCell>
                                <TableCell className="font-bold">
                                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(factura.total)}
                                </TableCell>
                                <TableCell>{getStatusBadge(factura.estado)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" title="Ver PDF"><FileText size={16} /></Button>
                                        <Button variant="ghost" size="icon" title="Enviar"><Send size={16} /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
