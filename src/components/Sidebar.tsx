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
    LogOut
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/master/dashboard' },
    { icon: Users, label: 'Clientes', href: '/master/clientes' },
    { icon: Monitor, label: 'Sistemas SaaS', href: '/master/sistemas' },
    { icon: FileText, label: 'Facturação', href: '/master/facturas' },
    { icon: FileSignature, label: 'Contratos', href: '/master/contratos' },
    { icon: UserRound, label: 'Colaboradores', href: '/master/colaboradores' },
    { icon: ClipboardList, label: 'Ordens de Serviço', href: '/master/ordens-servico' },
    { icon: CreditCard, label: 'Saldos & Pagamentos', href: '/master/pagamentos' },
    { icon: FolderOpen, label: 'Documentos', href: '/master/documentos' },
]

export function Sidebar() {
    const pathname = usePathname()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/auth/login'
    }

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white">
            <div className="flex h-full flex-col px-3 py-4">
                <div className="mb-10 flex items-center px-2 py-4">
                    <span className="text-xl font-bold tracking-tight text-primary">
                        INCUBADORA
                    </span>
                </div>

                <nav className="flex-1 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
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
