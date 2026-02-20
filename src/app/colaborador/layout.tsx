'use client'

import { useState } from 'react'
import { CollaboratorSidebar } from '@/components/CollaboratorSidebar'
import { NotificationCenter } from '@/components/NotificationCenter'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CollaboratorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <CollaboratorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={cn(
                "transition-all duration-300",
                "lg:pl-64"
            )}>
                <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white px-4 lg:px-8 shadow-sm">
                    <div className="flex flex-1 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                            >
                                <Menu size={20} />
                            </button>
                            <h1 className="text-lg font-semibold text-slate-900 truncate">Área do Colaborador</h1>
                        </div>

                        <div className="flex items-center gap-2 lg:gap-4">
                            <NotificationCenter />
                            <div className="h-4 w-[1px] bg-slate-200 mx-1 lg:mx-2" />
                            <span className="text-xs lg:text-sm text-slate-500 hidden sm:inline">Colaborador</span>
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                C
                            </div>
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
