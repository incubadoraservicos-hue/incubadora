'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { LogOut, Home, Wallet, Users, HandCoins, Menu, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function SubscritorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()
    const supabase = createClient()

    const menuItems = [
        { icon: Home, label: 'Início', href: '/subscritor' },
        { icon: Wallet, label: 'Minha Carteira', href: '/subscritor/carteira' },
        { icon: Users, label: 'Grupos (Txuna)', href: '/subscritor/grupos' },
        { icon: HandCoins, label: 'Crédito Mali', href: '/subscritor/creditos' },
    ]

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/auth/login'
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Mobile Sidebar */}
            <div className={cn(
                "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden",
                sidebarOpen ? "block" : "hidden"
            )} onClick={() => setSidebarOpen(false)} />

            <aside className={cn(
                "fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r transition-transform lg:translate-x-0 shadow-xl lg:shadow-none",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full p-4">
                    <div className="mb-10 px-4">
                        <div className="relative h-12 w-32">
                            <Image src="/logo.png" alt="Logo" fill className="object-contain" unoptimized />
                        </div>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                                    pathname === item.href
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <button
                        onClick={handleSignOut}
                        className="mt-auto flex items-center gap-3 px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut size={20} /> Sair
                    </button>
                </div>
            </aside>

            <main className="lg:pl-64 min-h-screen">
                <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-40">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-4 ml-auto">
                        <Bell className="text-slate-400 h-5 w-5" />
                        <div className="h-4 w-[1px] bg-slate-200" />
                        <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Painel Subscritor</span>
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">S</div>
                    </div>
                </header>
                <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
