'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Key, Download, Copy, ShieldCheck, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function GeradorLicencasPage() {
    const supabase = createClient()
    const [sistemas, setSistemas] = useState<any[]>([])
    const [clientes, setClientes] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        sistema_id: '',
        cliente_id: '',
        validade_meses: '12',
        hardware_id: '',
        formato: 'bin' // bin, txt, json
    })

    const [generatedKey, setGeneratedKey] = useState<string | null>(null)

    useEffect(() => {
        const loadData = async () => {
            const [sRes, cRes] = await Promise.all([
                supabase.from('sistemas').select('id, nome'),
                supabase.from('clientes').select('id, nome').eq('estado', 'activo')
            ])
            setSistemas(sRes.data || [])
            setClientes(cRes.data || [])
        }
        loadData()
    }, [])

    const generateLicense = async () => {
        if (!formData.sistema_id || !formData.cliente_id) {
            toast.error('Seleccione o sistema e o cliente')
            return
        }

        setLoading(true)
        try {
            // Logic to generate a robust key for offline use
            // This normally would include an encrypted payload with expiry and hardware ID
            const payload = {
                sys: formData.sistema_id.split('-')[0],
                cli: formData.cliente_id.split('-')[0],
                hw: formData.hardware_id || 'ANY',
                exp: new Date(new Date().setMonth(new Date().getMonth() + parseInt(formData.validade_meses))).toISOString().split('T')[0]
            }

            const rawKey = btoa(JSON.stringify(payload)).replace(/=/g, '')
            const formattedKey = (rawKey.match(/.{1,4}/g) || []).join('-').toUpperCase().substring(0, 24)

            const { error } = await supabase.from('licencas').insert([{
                sistema_id: formData.sistema_id,
                cliente_id: formData.cliente_id,
                chave_licenca: formattedKey,
                data_expiracao: payload.exp,
                metadata: { hardware_id: formData.hardware_id, formato: formData.formato }
            }])

            if (error) throw error

            setGeneratedKey(formattedKey)
            toast.success('Licença gerada com sucesso!')
        } catch (err: any) {
            toast.error('Erro ao gerar: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const downloadLicense = () => {
        if (!generatedKey) return

        let content = ''
        let mime = 'text/plain'
        let filename = `licenca_${formData.sistema_id.substring(0, 4)}`

        if (formData.formato === 'json') {
            content = JSON.stringify({ key: generatedKey, hardware: formData.hardware_id }, null, 2)
            mime = 'application/json'
            filename += '.json'
        } else if (formData.formato === 'bin') {
            content = `--- BEGIN INCUBADORA LICENSE ---\n${btoa(generatedKey)}\n--- END ---`
            filename += '.lic'
        } else {
            content = generatedKey
            filename += '.txt'
        }

        const blob = new Blob([content], { type: mime })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gerador de Licenças Offline</h2>
                    <p className="text-slate-500">Emita chaves de activação para software sem internet.</p>
                </div>
                <ShieldCheck className="h-10 w-10 text-emerald-500" />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <Card className="md:col-span-2 border-none shadow-xl bg-white">
                    <CardHeader className="border-b bg-slate-50/50">
                        <CardTitle className="text-lg">Configuração da Licença</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Sistema SaaS</Label>
                                <Select onValueChange={v => setFormData({ ...formData, sistema_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sistemas.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Cliente</Label>
                                <Select onValueChange={v => setFormData({ ...formData, cliente_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Hardware ID (Opcional)</Label>
                                <Input
                                    placeholder="Ex: UUID da Máquina"
                                    value={formData.hardware_id}
                                    onChange={e => setFormData({ ...formData, hardware_id: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-400 italic">Prender licença a um computador específico.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Validade (Meses)</Label>
                                <Select value={formData.validade_meses} onValueChange={v => setFormData({ ...formData, validade_meses: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Mês</SelectItem>
                                        <SelectItem value="3">3 Meses</SelectItem>
                                        <SelectItem value="6">6 Meses</SelectItem>
                                        <SelectItem value="12">1 Ano (Recomendado)</SelectItem>
                                        <SelectItem value="24">2 Anos</SelectItem>
                                        <SelectItem value="999">Vitalícia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Formato do Ficheiro de Saída</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {['bin', 'txt', 'json'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFormData({ ...formData, formato: f })}
                                        className={`p-3 rounded-lg border text-sm font-bold transition-all ${formData.formato === f
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                                                : 'bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        .{f.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-bold"
                            onClick={generateLicense}
                            disabled={loading}
                        >
                            {loading ? <RefreshCw className="animate-spin mr-2" /> : <Key className="mr-2 h-4 w-4" />}
                            Gerar Chave de Activação
                        </Button>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-none shadow-lg bg-slate-900 text-white overflow-hidden">
                        <CardHeader className="bg-white/5 border-b border-white/10">
                            <CardTitle className="text-sm font-medium opacity-70">Licença Gerada</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                            {generatedKey ? (
                                <>
                                    <div className="font-mono text-xl font-bold tracking-widest text-emerald-400 bg-emerald-400/10 p-4 rounded-lg w-full break-all border border-emerald-400/20">
                                        {generatedKey}
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        <Button
                                            variant="secondary"
                                            className="flex-1 text-xs"
                                            onClick={() => {
                                                navigator.clipboard.writeText(generatedKey)
                                                toast.success('Copiado!')
                                            }}
                                        >
                                            <Copy size={12} className="mr-1" /> Copiar
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="flex-1 text-xs"
                                            onClick={downloadLicense}
                                        >
                                            <Download size={12} className="mr-1" /> Baixar .{formData.formato}
                                        </Button>
                                    </div>
                                    <div className="text-[10px] opacity-40">
                                        Esta licença deve ser importada no software cliente.
                                    </div>
                                </>
                            ) : (
                                <div className="py-12 px-4 opacity-30 italic text-sm">
                                    Preencha os dados à esquerda para gerar a sua primeira licença offline.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-indigo-50 border border-indigo-100">
                        <CardContent className="p-4 space-y-3">
                            <h4 className="font-bold text-indigo-900 text-sm">💡 Dica Offline</h4>
                            <p className="text-xs text-indigo-700 leading-relaxed">
                                Use o campo <strong>Hardware ID</strong> para garantir que a licença não seja copiada para outro computador. O ID pode ser o número de série do disco ou o ID da motherboard.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
