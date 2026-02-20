'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    ClipboardList,
    Wallet,
    Files,
    FileSignature,
    Settings,
    LogOut,
    X
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'

const menuItems = [
    { icon: ClipboardList, label: 'Minhas Missões', href: '/colaborador/minhas-os' },
    { icon: FileSignature, label: 'Meus Acordos', href: '/colaborador/meus-contratos' },
    { icon: Wallet, label: 'Meu Saldo', href: '/colaborador/meu-saldo' },
    { icon: Files, label: 'Meus Documentos', href: '/colaborador/meus-documentos' },
    { icon: Settings, label: 'Configurações', href: '/colaborador/configuracoes' },
]

interface CollaboratorSidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

export function CollaboratorSidebar({ isOpen, onClose }: CollaboratorSidebarProps) {
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
                <div className="mb-10 flex items-center justify-between px-4 py-2">
                    <div className="relative h-10 w-32">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            fill
                            sizes="150px"
                            className="object-contain object-left"
                            unoptimized
                            priority
                        />
                    </div>
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => onClose?.()}
                            className={cn(
                                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                pathname === item.href
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
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
