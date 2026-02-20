import React from 'react'
import { CheckCircle2, ShieldCheck, Award } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface TermoProps {
    id: string
    colaborador: any
    descricao: string
    valor: number
    data: string
    assinado?: boolean
}

export function TermoCompromissoDocument({ id, colaborador, descricao, valor, data, assinado }: TermoProps) {
    return (
        <div id="termo-print" className="bg-white p-12 max-w-[800px] mx-auto text-slate-800 font-serif shadow-lg border leading-relaxed">
            <div className="text-center mb-10">
                <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-900">Termo de Compromisso e Sigilo</h1>
                <p className="text-sm text-slate-500 mt-2">INCUBADORA DE SOLUÇÕES - PRESTAÇÃO DE SERVIÇOS TÉCNICOS</p>
            </div>

            <div className="space-y-6 text-justify">
                <p>
                    Pelo presente instrumento, o Sr. <strong>AFONSO PENE</strong>, doravante denominado Contratante,
                    contrata os serviços do(a) Sr(a). <strong>{colaborador?.nome || '________________________________'}</strong>,
                    titular do NUIT <strong>{colaborador?.nuit || '________________'}</strong>, doravante denominado(a) Prestador(a),
                    para a execução das seguintes actividades:
                </p>

                <div className="bg-slate-50 p-6 rounded border border-slate-200 italic">
                    {descricao || '____________________________________________________________________________________________________________________________________________________'}
                </div>

                <div>
                    <h3 className="font-bold underline mb-2">1. Das Condições Financeiras</h3>
                    <p>
                        Pela execução dos trabalhos acima descritos, o Contratante pagará ao Prestador o valor total de
                        <strong> {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(valor)}</strong>.
                        Este valor já contempla todos os impostos e encargos legais aplicáveis à natureza do serviço.
                    </p>
                </div>

                <div>
                    <h3 className="font-bold underline mb-2">2. Do Sigilo e Confidencialidade</h3>
                    <p>
                        O Prestador compromete-se a manter <strong>sigilo absoluto</strong> sobre todos os dados, projectos, códigos-fonte,
                        estratégias de negócio e informações de clientes aos quais venha a ter acesso durante a execução deste trabalho.
                        A quebra deste sigilo resultará em consequências legais civis e criminais.
                    </p>
                </div>

                <div>
                    <h3 className="font-bold underline mb-2">3. Da Aceitação</h3>
                    <p>
                        Eu, <strong>{colaborador?.nome || '________________________________'}</strong>, aceito integralmente as condições
                        do trabalho acima descrito e comprometo-me a cumprir rigorosamente os prazos e as cláusulas de confidencialidade estabelecidas.
                    </p>
                </div>
            </div>

            <div className="mt-20 flex justify-between items-end">
                <div className="text-center w-64 border-t border-slate-400 pt-2">
                    <p className="font-bold">Afonso Pene</p>
                    <p className="text-[10px] text-slate-400">Contratante</p>
                </div>

                <div className="text-center w-64 relative pt-10">
                    <div className="border-t border-slate-400 w-full mb-2"></div>
                    {assinado ? (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center w-full z-10">
                            {/* O Selo Verde "Checked" */}
                            <div className="relative">
                                <div className="bg-emerald-500 text-white rounded-full p-2 shadow-lg scale-125 mb-2 rotate-12 border-4 border-white">
                                    <CheckCircle2 size={32} strokeWidth={3} />
                                </div>
                                <div className="absolute -right-8 -top-2 bg-indigo-600 text-[8px] text-white px-2 py-0.5 rounded-full font-sans font-bold uppercase tracking-tighter shadow-sm">
                                    Verificado
                                </div>
                            </div>

                            <span className="font-['Cursive',_cursive] text-2xl text-indigo-800 italic opacity-90 select-none mt-2">
                                {colaborador?.nome || 'Assinado'}
                            </span>
                            <div className="flex flex-col items-center text-emerald-600 mt-1 font-bold font-sans uppercase text-[8px] tracking-widest">
                                <div className="flex items-center gap-1">
                                    <ShieldCheck size={10} /> Autenticidade Garantida
                                </div>
                                <p className="text-slate-400 mt-1 font-mono">HASH: {id?.substring(0, 8).toUpperCase()}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-10 w-full flex items-center justify-center italic text-slate-300 text-xs">
                            Aguardando assinatura digital...
                        </div>
                    )}
                    <p className="font-bold mt-2">{colaborador?.nome || 'Prestador'}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Assinatura Digital do Prestador</p>
                </div>
            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
                <div className="text-left">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-sans">Validação de Documento</p>
                    <div className="flex items-center gap-3 mt-2">
                        <QRCodeSVG
                            value={`https://incubadora.co.mz/validar/${id}`}
                            size={60}
                            level="M"
                            includeMargin={false}
                        />
                        <div className="text-[8px] text-slate-400 max-w-[200px] leading-tight font-sans">
                            Aponte a câmara do telemóvel para o QR Code para verificar a autenticidade deste documento e a validade da assinatura digital.
                        </div>
                    </div>
                </div>
                <div className="text-[9px] text-slate-400 text-right uppercase tracking-widest font-sans">
                    MAPUTO, MOÇAMBIQUE • {new Date().toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
            </div>
        </div>
    )
}
