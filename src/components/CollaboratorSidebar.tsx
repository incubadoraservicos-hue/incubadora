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
    LogOut
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

export function CollaboratorSidebar() {
    const pathname = usePathname()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/auth/login'
    }

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white">
            <div className="flex h-full flex-col px-3 py-4">
                <div className="mb-10 flex items-center px-4 py-2">
                    <div className="relative h-12 w-full">
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
