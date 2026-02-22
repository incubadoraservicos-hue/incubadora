'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Download, QrCode, FileDown, Share2, Link, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
// import domtoimage from 'dom-to-image-more'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

interface ReceiptModalProps {
    os: any
    isOpen: boolean
    onClose: () => void
}

export function ReceiptModal({ os, isOpen, onClose }: ReceiptModalProps) {
    const [empresa, setEmpresa] = useState<any>(null)
    const [colaborador, setColaborador] = useState<any>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (isOpen && os) {
            fetchData()
        }
    }, [isOpen, os])

    const fetchData = async () => {
        const [empRes, colabRes] = await Promise.all([
            supabase.from('empresas').select('*').single(),
            supabase.from('colaboradores').select('*').eq('id', os.colaborador_id).single()
        ])

        if (empRes.data) setEmpresa(empRes.data)
        if (colabRes.data) setColaborador(colabRes.data)
    }

    const handleDownloadPDF = async () => {
        const element = document.getElementById('receipt-content')
        if (!element) return

        setIsGenerating(true)
        try {
            const domtoimage = (await import('dom-to-image-more')).default
            const dataUrl = await domtoimage.toPng(element, {
                quality: 1,
                bgcolor: '#ffffff',
                width: element.offsetWidth * 2,
                height: element.offsetHeight * 2,
                style: {
                    transform: 'scale(2)',
                    transformOrigin: 'top left'
                }
            })

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, (element.offsetHeight * 80) / element.offsetWidth]
            })

            pdf.addImage(dataUrl, 'PNG', 0, 0, 80, (element.offsetHeight * 80) / element.offsetWidth)
            pdf.save(`recibo-${os.numero}.pdf`)
            toast.success('PDF gerado com sucesso!')
        } catch (error) {
            console.error('Erro ao gerar PDF:', error)
            toast.error('Erro ao gerar o ficheiro PDF.')
        } finally {
            setIsGenerating(false)
        }
    }

    const getShareUrl = () => `${window.location.origin}/publico/comprovativo?id=${os.id}`

    const handleCopyLink = () => {
        navigator.clipboard.writeText(getShareUrl())
        toast.success('Link de partilha copiado!')
    }

    const handleWhatsAppShare = () => {
        const shareUrl = getShareUrl()
        const message = `Caro *${colaborador?.nome || 'Colaborador'}*, segue o link oficial para o comprovativo do pagamento pelo serviço: "${os.descricao}" prestado à #INCUBADORADESOLUCOES.\n\nVisualizar Comprovativo:\n${shareUrl}`
        const encodedMessage = encodeURIComponent(message)
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
    }

    if (!os) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[420px] p-0 overflow-hidden border-none bg-transparent shadow-none">
                <VisuallyHidden.Root>
                    <DialogTitle>Recibo de Pagamento - {os.numero}</DialogTitle>
                </VisuallyHidden.Root>

                {/* O conteúdo do recibo com cores fixas HEX para evitar erro 'lab' no PDF */}
                <div
                    id="receipt-content"
                    style={{ backgroundColor: '#ffffff', color: '#000000' }}
                    className="bg-white p-8 font-mono text-[12px] shadow-2xl mx-auto rounded-sm"
                >
                    {/* Header */}
                    <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4 mb-4" style={{ borderColor: '#000000' }}>
                        <div className="font-black text-lg uppercase tracking-widest" style={{ color: '#000000' }}>{empresa?.nome || 'INCUBADORA DE SOLUÇÕES'}</div>
                        <div className="text-[11px] font-bold uppercase" style={{ color: '#666666' }}>Master: Afonso Pene</div>
                        <div className="text-[10px]" style={{ color: '#666666' }}>
                            NUIT: {empresa?.nuit || '---'} | Tel: {empresa?.telefone || '---'}<br />
                            {empresa?.email || 'geral@incubadora.co.mz'}
                        </div>
                    </div>

                    <div className="text-center font-bold text-[14px] mb-6 uppercase border-y py-1" style={{ borderColor: '#000000', color: '#000000' }}>
                        COMPROVATIVO DE PAGAMENTO
                    </div>

                    {/* Data */}
                    <div className="space-y-4" style={{ color: '#000000' }}>
                        <div className="flex justify-between">
                            <span style={{ color: '#666666' }}>REF:</span>
                            <span className="font-bold">{os.numero}</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: '#666666' }}>DATA:</span>
                            <span>{os.data_pagamento ? new Date(os.data_pagamento).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                        </div>

                        <div className="pt-2 border-t border-dotted" style={{ borderColor: '#cccccc' }}>
                            <div style={{ color: '#666666' }} className="mb-1 text-[10px]">COLABORADOR:</div>
                            <div className="font-bold uppercase">{colaborador?.nome || '---'}</div>
                            <div className="text-[10px]" style={{ color: '#666666' }}>BI/PASS: {colaborador?.bi_passaporte || '---'}</div>
                        </div>

                        <div className="pt-2 border-t border-dotted" style={{ borderColor: '#cccccc' }}>
                            <div style={{ color: '#666666' }} className="mb-1 text-[10px]">DESCRIÇÃO:</div>
                            <div className="leading-tight text-[11px]">{os.descricao}</div>
                        </div>

                        <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-end" style={{ borderColor: '#000000' }}>
                            <div className="font-extrabold text-[14px]">VALOR TOTAL:</div>
                            <div className="font-black text-[18px]">
                                {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(os.valor)}
                            </div>
                        </div>

                        {os.revisao_master && (
                            <div className="pt-3 border-t border-blue-100 mt-3 p-2 rounded" style={{ backgroundColor: '#f0f7ff', borderColor: '#d1e9ff' }}>
                                <div style={{ color: '#2563eb' }} className="text-[9px] font-bold uppercase mb-1">Feedback do Master:</div>
                                <div style={{ color: '#334155' }} className="text-[10px] italic leading-tight">"{os.revisao_master}"</div>
                            </div>
                        )}
                    </div>

                    {/* Footer / QR */}
                    <div className="mt-8 pt-6 border-t border-dashed flex flex-col items-center gap-4" style={{ borderColor: '#cccccc' }}>
                        <div className="p-2 bg-slate-100 rounded" style={{ backgroundColor: '#f1f5f9' }}>
                            <QrCode size={80} style={{ color: '#000000' }} />
                        </div>
                        <div className="text-center text-[9px] uppercase tracking-tighter" style={{ color: '#999999' }}>
                            Este documento serve como comprovativo oficial de liquidação de prestação de serviços entre a Incubadora e o Colaborador.
                        </div>
                        <div className="font-bold text-[10px]" style={{ color: '#000000' }}>OBRIGADO PELO SEU TRABALHO</div>
                    </div>
                </div>

                {/* Acções */}
                <div className="mt-4 grid grid-cols-2 gap-2 px-4 pb-6">
                    <Button
                        disabled={isGenerating}
                        onClick={handleDownloadPDF}
                        className="col-span-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg h-10 text-xs font-bold gap-2 shadow-md"
                    >
                        {isGenerating ? 'A gerar...' : <><FileDown size={18} /> Baixar Comprovativo PDF</>}
                    </Button>

                    <Button
                        onClick={handleWhatsAppShare}
                        className="bg-[#25D366] text-white hover:bg-[#128C7E] rounded-lg h-10 text-xs font-bold gap-2 shadow-md"
                    >
                        <MessageCircle size={18} /> WhatsApp
                    </Button>

                    <Button
                        onClick={handleCopyLink}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg h-10 text-xs font-bold gap-2 shadow-md"
                    >
                        <Link size={18} /> Copiar Link
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="col-span-2 mt-2 bg-white/20 backdrop-blur-md text-white border border-white/30 h-10 rounded-lg text-xs"
                    >
                        Fechar Visualização
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
