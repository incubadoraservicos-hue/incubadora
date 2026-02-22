'use client'

import React from 'react'
import Image from 'next/image'
import {
    User,
    Briefcase,
    Wallet,
    History,
    FileCheck,
    Award,
    TrendingUp,
    MapPin,
    Smartphone,
    Globe
} from 'lucide-react'

interface ProcessReportProps {
    colab: any
    missions: any[]
    payments: any[]
    wallet: any
    stats: any
}

export function CollaboratorProcessReport({ colab, missions, payments, wallet, stats }: ProcessReportProps) {
    const today = new Date().toLocaleDateString('pt-MZ')

    return (
        <div id="processo-report" className="min-h-screen bg-white p-[40px] text-slate-900 font-sans border shadow-inner">
            {/* Header / Timbrado */}
            <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center">
                        <User className="text-white w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-indigo-950">Ficha de Processo Individual</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Incubadora de Soluções - Moçambique</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Documento Gerado em</p>
                    <p className="text-sm font-bold text-indigo-600">{today}</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Sidebar Info */}
                <div className="col-span-4 space-y-6">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <h2 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                            <User size={14} /> Dados Pessoais
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Nome Completo</p>
                                <p className="text-sm font-bold">{colab?.nome}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Identificação (BI)</p>
                                <p className="text-sm font-bold">{colab?.bi_passaporte || 'N/A'}</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Telefone</p>
                                    <p className="text-xs font-medium">{colab?.telefone || '---'}</p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Data de Ingresso</p>
                                    <p className="text-xs font-medium">{new Date(colab?.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <h2 className="text-xs font-black uppercase text-indigo-400 mb-4 tracking-widest flex items-center gap-2">
                            <Wallet size={14} /> Resumo Financeiro
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-indigo-100 pb-2">
                                <span className="text-[10px] uppercase font-bold text-indigo-900/60">Saldo em Carteira</span>
                                <span className="text-lg font-black text-indigo-600">
                                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(wallet?.saldo_disponivel || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-end border-b border-indigo-100 pb-2">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Saldo Cativo</span>
                                <span className="text-sm font-bold">
                                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(wallet?.saldo_cativo || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Total Recebido</span>
                                <span className="text-sm font-bold text-emerald-600">
                                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats?.totalRecebido || 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-slate-900 text-white rounded-2xl">
                        <h2 className="text-xs font-black uppercase text-indigo-400 mb-4 tracking-widest flex items-center gap-2">
                            <Briefcase size={14} /> Desempenho
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-white/5 rounded-xl">
                                <p className="text-[8px] uppercase text-slate-400 mb-1">Missões Totais</p>
                                <p className="text-xl font-black">{missions?.length || 0}</p>
                            </div>
                            <div className="text-center p-3 bg-white/5 rounded-xl">
                                <p className="text-[8px] uppercase text-slate-400 mb-1">Taxa Sucesso</p>
                                <p className="text-xl font-black">{stats?.successRate || '100'}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Body */}
                <div className="col-span-8 space-y-8">
                    {/* Especialidades & Tags */}
                    <div>
                        <h3 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-[0.2em] border-l-4 border-indigo-600 pl-3">Perfil Técnico</h3>
                        <div className="flex flex-wrap gap-2">
                            {colab?.especialidades?.map((e: string) => (
                                <span key={e} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 uppercase">
                                    {e}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Missions History */}
                    <div>
                        <h3 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-[0.2em] border-l-4 border-indigo-600 pl-3">Histórico de Missões</h3>
                        <div className="overflow-hidden border border-slate-100 rounded-2xl">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 uppercase font-black text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3">Ref</th>
                                        <th className="px-4 py-3">Descrição / Objecto</th>
                                        <th className="px-4 py-3">Estado</th>
                                        <th className="px-4 py-3 text-right">Honorários</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {missions?.length === 0 ? (
                                        <tr><td colSpan={4} className="p-4 text-center text-slate-400">Nenhuma missão registada.</td></tr>
                                    ) : missions?.map(m => (
                                        <tr key={m.id}>
                                            <td className="px-4 py-3 font-mono text-indigo-600 font-bold">{m.numero}</td>
                                            <td className="px-4 py-3 font-medium">{m.descricao}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] uppercase font-bold text-slate-500">
                                                    {m.estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-black">
                                                {new Intl.NumberFormat('pt-MZ').format(m.valor_colaborador || 0)} MT
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Additional Notes / Legal */}
                    <div className="mt-12 p-6 border-2 border-dashed border-slate-200 rounded-3xl">
                        <div className="flex gap-4 items-center mb-4">
                            <Award className="text-amber-500 w-8 h-8" />
                            <h4 className="font-bold text-lg uppercase italic text-indigo-950">Validado pela Incubadora Hub</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed italic">
                            Certifica-se que este documento reflecte fielmente o estado do colaborador no sistema central da Incubadora de Soluções.
                            O colaborador mantém um vínculo de prestação de serviços regido por contrato e acordos de sigilo vigentes.
                        </p>
                    </div>

                    {/* Footer / Signature Area */}
                    <div className="pt-16 grid grid-cols-2 gap-12 text-center">
                        <div className="space-y-2">
                            <div className="border-b border-slate-300 pb-2"></div>
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-tighter">O Colaborador</p>
                            <p className="text-xs font-bold">{colab?.nome}</p>
                        </div>
                        <div className="space-y-2">
                            <div className="border-b border-indigo-200 pb-2"></div>
                            <p className="text-[10px] font-bold uppercase text-indigo-400 tracking-tighter">Direção Financeira Hub</p>
                            <p className="text-xs font-black text-indigo-950">Afonso Pene</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Page Footer */}
            <div className="mt-20 border-t border-slate-100 pt-6 flex justify-between items-center text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                <span>© 2026 Incubadora de Soluções Hub | MZ</span>
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><Globe size={8} /> hub.incubadora.co.mz</span>
                    <span className="flex items-center gap-1"><Smartphone size={8} /> +258 84 000 0000</span>
                </div>
            </div>
        </div>
    )
}
