'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode, FileDown, Loader2 } from 'lucide-react'
// import domtoimage from 'dom-to-image-more'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

function PublicReceiptContent() {
    const searchParams = useSearchParams()
    const osId = searchParams.get('id')
    const [os, setOs] = useState<any>(null)
    const [empresa, setEmpresa] = useState<any>(null)
    const [colaborador, setColaborador] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (osId) {
            fetchData()
        }
    }, [osId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: osData, error: osError } = await supabase
                .from('ordens_servico')
                .select('*')
                .eq('id', osId)
                .single()

            if (osError || !osData) throw new Error('Comprovativo não encontrado')
            setOs(osData)

            const [empRes, colabRes] = await Promise.all([
                supabase.from('empresas').select('*').single(),
                supabase.from('colaboradores').select('*').eq('id', osData.colaborador_id).single()
            ])

            if (empRes.data) setEmpresa(empRes.data)
            if (colabRes.data) setColaborador(colabRes.data)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadPDF = async () => {
        const element = document.getElementById('receipt-content')
        if (!element) return

        setIsGenerating(true)
        try {
            const domtoimage = (await import('dom-to-image-more')).default
            const dataUrl = await domtoimage.toPng(element, {
                quality: 1,
                bgcolor: '#ffffff'
            })

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, (element.offsetHeight * 80) / element.offsetWidth]
            })
            pdf.addImage(dataUrl, 'PNG', 0, 0, 80, (element.offsetHeight * 80) / element.offsetWidth)
            pdf.save(`comprovativo-${os.numero}.pdf`)
        } catch (error) {
            console.error('Erro ao gerar PDF:', error)
            toast.error('Erro ao gerar PDF')
        } finally {
            setIsGenerating(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
    )

    if (!os) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
            <Card className="max-w-md w-full">
                <CardContent className="pt-10 pb-10">
                    <p className="text-slate-500">Este comprovativo não existe ou foi removido.</p>
                </CardContent>
            </Card>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-100 py-10 px-4 flex flex-col items-center gap-6">
            <div id="receipt-content" className="bg-white p-8 max-w-[400px] w-full shadow-xl rounded-sm font-mono text-[12px] text-slate-800">
                <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4 mb-4">
                    <div className="font-black text-lg uppercase tracking-widest">{empresa?.nome || 'INCUBADORA DE SOLUÇÕES'}</div>
                    <div className="text-[11px] font-bold uppercase text-slate-500">Master: Afonso Pene</div>
                    <div className="text-[10px] opacity-70">
                        NUIT: {empresa?.nuit || '---'} | Tel: {empresa?.telefone || '---'}<br />
                        {empresa?.email || 'geral@incubadora.co.mz'}
                    </div>
                </div>

                <div className="text-center font-bold text-[14px] mb-6 uppercase border-y py-1">
                    COMPROVATIVO DE PAGAMENTO
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between">
                        <span className="opacity-60">REF:</span>
                        <span className="font-bold">{os.numero}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="opacity-60">DATA:</span>
                        <span>{os.data_pagamento ? new Date(os.data_pagamento).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                    </div>

                    <div className="pt-2 border-t border-dotted">
                        <div className="opacity-60 mb-1">COLABORADOR:</div>
                        <div className="font-bold uppercase">{colaborador?.nome || '---'}</div>
                        <div className="text-[10px]">BI/PASS: {colaborador?.bi_passaporte || '---'}</div>
                    </div>

                    <div className="pt-2 border-t border-dotted">
                        <div className="opacity-60 mb-1">DESCRIÇÃO:</div>
                        <div className="leading-tight text-[11px]">{os.descricao}</div>
                    </div>

                    <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-end">
                        <div className="font-extrabold text-[14px]">VALOR TOTAL:</div>
                        <div className="font-black text-[18px]">
                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(os.valor)}
                        </div>
                    </div>

                    {os.revisao_master && (
                        <div className="pt-4 border-t border-blue-200 mt-4 bg-blue-50/50 p-3 rounded">
                            <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">Nota de Revisão (Master):</div>
                            <div className="text-[11px] italic text-slate-700 leading-tight">"{os.revisao_master}"</div>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-dashed flex flex-col items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded">
                        <QrCode size={80} className="text-slate-900" />
                    </div>
                    <div className="text-center text-[9px] opacity-50 uppercase tracking-tighter">
                        Autenticado via Incubadora de Soluções.
                    </div>
                </div>
            </div>

            <Button
                onClick={handleDownloadPDF}
                className="w-full max-w-[400px] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold flex items-center justify-center gap-2"
                disabled={isGenerating}
            >
                {isGenerating ? <Loader2 className="animate-spin" /> : <FileDown size={20} />}
                Baixar Comprovativo em PDF
            </Button>

            <p className="text-[10px] text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm">
                Documento Seguro & Oficial
            </p>
        </div>
    )
}

export default function PublicReceiptPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <PublicReceiptContent />
        </Suspense>
    )
}
