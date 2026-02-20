'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft, Save, FileUp } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

export default function NovaFacturaPage() {
    const router = useRouter()
    const supabase = createClient()
    const [clientes, setClientes] = useState<any[]>([])
    const [sistemas, setSistemas] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const [isExternal, setIsExternal] = useState(false)
    const [formData, setFormData] = useState({
        cliente_id: '',
        data_vencimento: '',
        notas: '',
        linhas: [{ descricao: '', qtd: 1, preco_unit: 0, iva: 16 }] as any[],
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const [cRes, sRes] = await Promise.all([
            supabase.from('clientes').select('id, nome').eq('estado', 'activo'),
            supabase.from('sistemas').select('id, nome, valor_base')
        ])
        if (cRes.data) setClientes(cRes.data)
        if (sRes.data) setSistemas(sRes.data)
    }

    const addLinha = () => {
        setFormData({
            ...formData,
            linhas: [...formData.linhas, { descricao: '', qtd: 1, preco_unit: 0, iva: 16 }]
        })
    }

    const removeLinha = (index: number) => {
        const newLinhas = formData.linhas.filter((_, i) => i !== index)
        setFormData({ ...formData, linhas: newLinhas })
    }

    const updateLinha = (index: number, field: string, value: any) => {
        const newLinhas = [...formData.linhas]
        newLinhas[index][field] = value
        setFormData({ ...formData, linhas: newLinhas })
    }

    const calculateTotals = () => {
        let subtotal = 0
        let ivaTotal = 0
        formData.linhas.forEach(l => {
            const valor = l.qtd * l.preco_unit
            subtotal += valor
            ivaTotal += valor * (l.iva / 100)
        })
        return { subtotal, ivaTotal, total: subtotal + ivaTotal }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { subtotal, ivaTotal, total } = calculateTotals()
            const numero = `INV${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 899)}`

            const { data, error } = await supabase.from('facturas').insert([{
                ...formData,
                numero,
                subtotal,
                iva_total: ivaTotal,
                total,
                estado: 'emitida',
                externa: isExternal,
                data_emissao: new Date().toISOString().split('T')[0]
            }]).select()

            if (error) throw error

            toast.success('Factura criada com sucesso!')
            router.push('/master/facturas')
        } catch (error: any) {
            toast.error('Erro ao criar factura: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const { subtotal, ivaTotal, total } = calculateTotals()

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h2 className="text-3xl font-bold tracking-tight">Nova Factura</h2>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6">
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Dados do Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Seleccionar Cliente</Label>
                                <Select onValueChange={v => setFormData({ ...formData, cliente_id: v })} required>
                                    <SelectTrigger className="bg-slate-50">
                                        <SelectValue placeholder="Escolha um cliente cadastrado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clientes.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Data de Vencimento</Label>
                                    <Input
                                        type="date"
                                        className="bg-slate-50"
                                        value={formData.data_vencimento}
                                        onChange={e => setFormData({ ...formData, data_vencimento: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pt-8">
                                    <Checkbox
                                        id="externa"
                                        checked={isExternal}
                                        onCheckedChange={(checked) => setIsExternal(!!checked)}
                                    />
                                    <Label htmlFor="externa" className="cursor-pointer">Factura Gerada Fora do Sistema</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-slate-900 text-white">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium opacity-70">Resumo Financeiro</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="opacity-70">Subtotal:</span>
                                <span>{subtotal.toLocaleString()} MT</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="opacity-70">IVA (16%):</span>
                                <span>{ivaTotal.toLocaleString()} MT</span>
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between font-bold text-xl">
                                <span>TOTAL:</span>
                                <span className="text-emerald-400">{total.toLocaleString()} MT</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {!isExternal && (
                    <Card className="border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Itens da Factura</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addLinha}>
                                <Plus className="mr-2 h-4 w-4" /> Adicionar Item
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {formData.linhas.map((linha, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-lg relative group">
                                        <div className="col-span-12 md:col-span-6 grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400">Descrição do Serviço / Produto</Label>
                                            <Input
                                                placeholder="Ex: Licença de Uso - Sistema HEFEL"
                                                value={linha.descricao}
                                                onChange={e => updateLinha(index, 'descricao', e.target.value)}
                                                className="bg-white"
                                                required
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2 grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400">Qtd</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={linha.qtd}
                                                onChange={e => updateLinha(index, 'qtd', parseInt(e.target.value))}
                                                className="bg-white"
                                                required
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-3 grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400">Preço Unitário (MT)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={linha.preco_unit}
                                                onChange={e => updateLinha(index, 'preco_unit', parseFloat(e.target.value))}
                                                className="bg-white"
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-400 hover:text-red-600 h-10 w-10 hover:bg-red-50"
                                                onClick={() => removeLinha(index)}
                                                disabled={formData.linhas.length === 1}
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {isExternal && (
                    <Card className="border-none shadow-sm border-dashed border-2 bg-slate-50/50">
                        <CardContent className="py-10 flex flex-col items-center justify-center text-slate-500">
                            <FileUp size={40} className="mb-4 opacity-30" />
                            <p className="font-medium">Anexar Ficheiro da Factura Externa</p>
                            <p className="text-xs mt-1">Carregue o PDF ou imagem da factura já existente.</p>
                            <Button type="button" variant="outline" className="mt-4">Seleccionar Ficheiro</Button>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                        {loading ? 'A processar...' : <><Save className="mr-2 h-4 w-4" /> Finalizar e Emitir</>}
                    </Button>
                </div>
            </form>
        </div>
    )
}
