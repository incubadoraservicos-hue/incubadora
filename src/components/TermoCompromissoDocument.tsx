'use client'

import React from 'react'
import { CheckCircle2 } from 'lucide-react'

interface TermoProps {
    colaborador: any
    descricao: string
    valor: number
    data: string
    assinado?: boolean
}

export function TermoCompromissoDocument({ colaborador, descricao, valor, data, assinado }: TermoProps) {
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

                <div className="text-center w-64 relative">
                    {assinado ? (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                            <span className="font-['Cursive',_cursive] text-2xl text-indigo-700 italic opacity-80 select-none">
                                {colaborador?.nome || 'Assinado'}
                            </span>
                            <div className="flex items-center text-emerald-600 mt-1 font-bold font-sans uppercase text-[10px]">
                                <CheckCircle2 size={12} className="mr-1" /> Aprovado Digitalmente
                            </div>
                            <p className="text-[8px] text-slate-400 font-sans mt-1">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                        </div>
                    ) : (
                        <div className="border-t border-slate-400 pt-2 h-10 w-full" />
                    )}
                    <p className="font-bold mt-2">{colaborador?.nome || 'Prestador'}</p>
                    <p className="text-[10px] text-slate-400">Assinatura do Prestador</p>
                </div>
            </div>

            <div className="mt-16 text-[9px] text-slate-400 text-center uppercase tracking-widest border-t pt-8">
                MAPUTO, MOÇAMBIQUE • {new Date().toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
        </div>
    )
}
