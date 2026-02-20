'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Monitor,
    FileText,
    FileSignature,
    UserRound,
    ClipboardList,
    CreditCard,
    FolderOpen,
    LogOut,
    Tags,
    BarChart3,
    Key,
    X
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/master/dashboard' },
    { icon: Users, label: 'Clientes', href: '/master/clientes' },
    { icon: Monitor, label: 'Sistemas SaaS', href: '/master/sistemas' },
    { icon: Tags, label: 'Outros Serviços', href: '/master/servicos' },
    { icon: FileText, label: 'Facturação', href: '/master/facturas' },
    { icon: FileSignature, label: 'Contratos', href: '/master/contratos' },
    { icon: UserRound, label: 'Colaboradores', href: '/master/colaboradores' },
    { icon: ClipboardList, label: 'Ordens de Serviço', href: '/master/ordens-servico' },
    { icon: Key, label: 'Licenças Offline', href: '/master/sistemas/licencas' },
    { icon: CreditCard, label: 'Saldos & Pagamentos', href: '/master/pagamentos' },
    { icon: FolderOpen, label: 'Documentos', href: '/master/documentos' },
    { icon: BarChart3, label: 'Painel Financeiro', href: '/master/relatorios' },
]

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/auth/login'
    }

    return (
        <aside className={cn(
            "fixed left-0 top-0 z-50 h-screen w-64 border-r bg-white transition-transform lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="flex h-full flex-col px-3 py-4">
                <div className="mb-8 flex items-center justify-between px-4 py-2">
                    <div className="relative h-12 w-32">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            fill
                            sizes="200px"
                            className="object-contain object-left"
                            unoptimized
                            priority
                        />
                    </div>
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                pathname === item.href
                                    ? "bg-primary text-white"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto border-t pt-4">
                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sair
                    </button>
                </div>
            </div>
        </aside>
    )
}
