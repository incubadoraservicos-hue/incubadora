'use client'
import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { NotificationCenter } from '@/components/NotificationCenter'
import { Menu, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function MasterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/auth/login'
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="lg:pl-64 transition-all duration-300">
                <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white px-4 lg:px-8 shadow-sm">
                    <div className="flex flex-1 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                            >
                                <Menu size={20} />
                            </button>
                            <h1 className="text-sm lg:text-lg font-bold tracking-tight text-slate-900 uppercase truncate">
                                <span className="hidden sm:inline">Incubadora de Soluções</span>
                                <span className="sm:hidden">Incubadora</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 lg:gap-4">
                            <NotificationCenter />
                            <div className="h-4 w-[1px] bg-slate-200 mx-1 lg:mx-2" />
                            <span className="text-[10px] lg:text-sm text-slate-500 font-medium hidden xs:inline">Afonso Pene (Master)</span>
                            <div className="h-7 w-7 lg:h-8 lg:w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] lg:text-xs font-bold shadow-md">
                                AP
                            </div>
                            <button
                                onClick={handleSignOut}
                                title="Sair do Sistema"
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>
                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
