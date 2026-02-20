'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface InvoiceProps {
    factura: any
    cliente: any
    empresa: any
}

export function InvoiceDocument({ factura, cliente, empresa }: InvoiceProps) {
    const currentYear = new Date().getFullYear()
    const emissao = new Date(factura.data_emissao).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' })
    const vencimento = new Date(factura.data_vencimento).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' })

    return (
        <div id="invoice-print" className="bg-white p-8 max-w-[800px] mx-auto text-slate-800 font-sans shadow-lg border">
            {/* Header */}
            <div className="bg-[#002B5B] text-white p-4 flex justify-between items-center -mx-8 -mt-8 mb-8">
                <h1 className="text-xl font-bold">Sales Invoice (E-Invoice)</h1>
                <div className="text-right">
                    <p className="text-sm opacity-80">Reference No.</p>
                    <p className="font-mono text-lg">{factura.numero}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="space-y-4">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill To:</p>
                        <p className="font-bold text-lg text-[#002B5B]">{cliente?.nome || 'Cliente não registado'}</p>
                        <p className="text-sm text-slate-500">{cliente?.endereco}</p>
                        <p className="text-sm text-slate-500">NUIT: {cliente?.nuit}</p>
                        <p className="text-sm text-slate-500">MOÇAMBIQUE</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Agent:</p>
                            <p className="text-sm font-bold">AFONSO PENE</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Term:</p>
                            <p className="text-sm font-bold">C.O.D</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Attention:</p>
                            <p className="text-sm font-bold">SAAS ADMIN</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end space-y-4">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Date:</p>
                        <p className="text-sm font-bold">{emissao}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Due Date:</p>
                        <p className="text-sm font-bold">{vencimento}</p>
                    </div>

                    <div className="pt-4 flex flex-col items-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Validar Documento (QR Code)</p>
                        <QRCodeSVG value={`https://incubadora.co.mz/v/${factura.id}`} size={100} level="M" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <table className="w-full mb-10">
                <thead>
                    <tr className="bg-[#002B5B] text-white text-[10px] uppercase tracking-wider">
                        <th className="p-3 text-left w-16">Code</th>
                        <th className="p-3 text-left">Description</th>
                        <th className="p-3 text-center w-16">Qty</th>
                        <th className="p-3 text-center w-20">UOM</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {factura.linhas?.map((linha: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-100">
                            <td className="p-3 font-mono text-slate-400">ITEM-{String(idx + 1).padStart(2, '0')}</td>
                            <td className="p-3 py-6 font-bold text-[#002B5B] max-w-xs">{linha.descricao}</td>
                            <td className="p-3 text-center">1</td>
                            <td className="p-3 text-center text-[10px] text-slate-400">UNIT(S)</td>
                            <td className="p-3 text-right">{new Intl.NumberFormat('pt-MZ').format(linha.preco_unit)}</td>
                            <td className="p-3 text-right font-bold">{new Intl.NumberFormat('pt-MZ').format(linha.preco_unit * linha.qtd)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer */}
            <div className="grid grid-cols-2 gap-8 items-end">
                <div className="space-y-4 text-[11px]">
                    <p className="font-bold text-slate-400 uppercase">Banking Details:</p>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-blue-600">BCI</span>
                        <div className="font-mono text-slate-600">
                            CONTA: 2936131910002 • NIB: 000800002936131910277
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-red-600">BIM</span>
                        <div className="font-mono text-slate-600">
                            CONTA: 136251730 • NIB: 000100000013625173057
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-yellow-500">E-MOLA</span>
                        <div className="font-mono text-slate-600">
                            MOBILE: 877981166 (AFONSO PENE)
                        </div>
                    </div>
                </div>

                <div>
                    <div className="bg-[#F3B600] p-4 text-[#002B5B]">
                        <div className="flex justify-between items-center font-bold">
                            <span>TOTAL AMOUNT (MT)</span>
                            <span className="text-2xl">{new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(factura.total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-20 mt-20 text-[10px] font-bold text-slate-400 uppercase">
                <div className="border-t border-slate-300 pt-2 text-center">Authorized Signature</div>
                <div className="border-t border-slate-300 pt-2 text-center">Received By Signature</div>
            </div>
        </div>
    )
}
