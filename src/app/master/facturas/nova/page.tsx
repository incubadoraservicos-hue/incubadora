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
    const [servicos, setServicos] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const [isExternal, setIsExternal] = useState(false)
    const [formData, setFormData] = useState({
        cliente_id: '',
        data_vencimento: '',
        notas: '',
        linhas: [{ descricao: '', qtd: 1, preco_unit: 0, iva: 0 }] as any[],
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const [cRes, sRes, svRes] = await Promise.all([
            supabase.from('clientes').select('id, nome').eq('estado', 'activo'),
            supabase.from('sistemas').select('id, nome, valor_base'),
            supabase.from('servicos').select('id, nome, preco_base').eq('ativo', true)
        ])
        if (cRes.data) setClientes(cRes.data)
        if (sRes.data) setSistemas(sRes.data)
        if (svRes.data) setServicos(svRes.data)
    }

    const addLinha = () => {
        setFormData({
            ...formData,
            linhas: [...formData.linhas, { descricao: '', qtd: 1, preco_unit: 0, iva: 0 }]
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

    const handleSelectItem = (index: number, type: 'sistema' | 'servico', id: string) => {
        if (type === 'sistema') {
            const item = sistemas.find(s => s.id === id)
            if (item) {
                updateLinha(index, 'descricao', `Licença: ${item.nome}`)
                updateLinha(index, 'preco_unit', item.valor_base)
            }
        } else {
            const item = servicos.find(s => s.id === id)
            if (item) {
                updateLinha(index, 'descricao', item.nome)
                updateLinha(index, 'preco_unit', item.preco_base)
            }
        }
    }

    const calculateTotals = () => {
        let subtotal = 0
        let ivaTotal = 0
        formData.linhas.forEach(l => {
            const valor = l.qtd * l.preco_unit
            subtotal += valor
            if (l.iva > 0) {
                ivaTotal += valor * (l.iva / 100)
            }
        })
        return { subtotal, ivaTotal, total: subtotal + ivaTotal }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.cliente_id) return toast.error('Seleccione um cliente')

        setLoading(true)
        try {
            const { subtotal, ivaTotal, total } = calculateTotals()
            const prefix = isExternal ? 'EXT' : 'INV'
            const numero = `${prefix}${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 899)}`

            const { data, error } = await supabase.from('facturas').insert([{
                ...formData,
                numero,
                subtotal,
                iva_total: ivaTotal,
                total,
                estado: 'emitida',
                notas: isExternal ? 'Factura externa carregada' : formData.notas,
                data_emissao: new Date().toISOString().split('T')[0]
            }]).select()

            if (error) throw error

            toast.success(isExternal ? 'Factura externa registada!' : 'Factura emitida com sucesso!')
            router.push('/master/facturas')
        } catch (error: any) {
            toast.error('Erro ao processar: ' + error.message)
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
                                    <Label htmlFor="externa" className="cursor-pointer font-medium text-blue-600">Factura Gerada Fora do Sistema</Label>
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
                                <span>{new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="opacity-70">IVA (16%):</span>
                                <span>{new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(ivaTotal)}</span>
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between font-bold text-xl">
                                <span>TOTAL:</span>
                                <span className="text-emerald-400">{new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(total)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Itens da Factura</CardTitle>
                            <p className="text-xs text-slate-500">Adicione produtos SaaS ou serviços manuais.</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addLinha} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Item
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {formData.linhas.map((linha, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-100 relative group">
                                    <div className="col-span-12 md:col-span-4 grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Serviço / Produto</Label>
                                        <div className="flex gap-2">
                                            <Select onValueChange={(v) => {
                                                const [type, id] = v.split(':')
                                                handleSelectItem(index, type as any, id)
                                            }}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Catálogo..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Manual</SelectItem>
                                                    <div className="px-2 py-1.5 text-xs font-bold text-slate-400">Sistemas SaaS</div>
                                                    {sistemas.map(s => (
                                                        <SelectItem key={s.id} value={`sistema:${s.id}`}>{s.nome}</SelectItem>
                                                    ))}
                                                    <div className="px-2 py-1.5 text-xs font-bold text-slate-400 mt-2">Outros Serviços</div>
                                                    {servicos.map(s => (
                                                        <SelectItem key={s.id} value={`servico:${s.id}`}>{s.nome}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                placeholder="Descrição customizada..."
                                                value={linha.descricao}
                                                onChange={e => updateLinha(index, 'descricao', e.target.value)}
                                                className="bg-white flex-1"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-3 md:col-span-1 grid gap-2">
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
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Preço Unit. (MT)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={linha.preco_unit}
                                            onChange={e => updateLinha(index, 'preco_unit', parseFloat(e.target.value))}
                                            className="bg-white"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-3 md:col-span-2 grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Imposto (IVA)</Label>
                                        <div className="flex items-center gap-2 h-10 px-3 bg-white border rounded-md">
                                            <Checkbox
                                                id={`iva-${index}`}
                                                checked={linha.iva === 16}
                                                onCheckedChange={(c) => updateLinha(index, 'iva', c ? 16 : 0)}
                                            />
                                            <Label htmlFor={`iva-${index}`} className="text-xs cursor-pointer">IVA 16%</Label>
                                        </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-1 flex justify-end pb-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-400 hover:text-red-600 h-9 w-9 hover:bg-red-50"
                                            onClick={() => removeLinha(index)}
                                            disabled={formData.linhas.length === 1}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {isExternal && (
                    <Card className="border-none shadow-sm border-dashed border-2 bg-blue-50/20 border-blue-200">
                        <CardContent className="py-10 flex flex-col items-center justify-center">
                            <FileUp size={40} className="mb-4 text-blue-400" />
                            <p className="font-bold text-blue-900 text-lg">Anexar Factura Externa</p>
                            <p className="text-sm text-blue-600 mt-1">Carregue o PDF original para arquivo e controlo.</p>
                            <label className="mt-4 cursor-pointer">
                                <div className="bg-white px-6 py-2 border-2 border-blue-200 rounded-full text-blue-700 font-bold hover:bg-blue-50 transition-colors shadow-sm">
                                    Seleccionar Ficheiro
                                </div>
                                <input type="file" className="hidden" accept=".pdf,image/*" onChange={() => toast.success('Ficheiro anexado!')} />
                            </label>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()} className="px-8">Cancelar</Button>
                    <Button type="submit" className="bg-slate-900 hover:bg-slate-800 px-10 h-11 h" disabled={loading}>
                        {loading ? 'A processar...' : <><Save className="mr-2 h-4 w-4" /> Finalizar e Emitir</>}
                    </Button>
                </div>
            </form>
        </div>
    )
}
