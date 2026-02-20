import { CollaboratorSidebar } from '@/components/CollaboratorSidebar'
import { NotificationCenter } from '@/components/NotificationCenter'

export default function CollaboratorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <CollaboratorSidebar />
            <main className="pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white px-8 shadow-sm">
                    <div className="flex flex-1 items-center justify-between">
                        <h1 className="text-lg font-semibold text-slate-900">Área do Colaborador</h1>
                        <div className="flex items-center gap-4">
                            <NotificationCenter />
                            <div className="h-4 w-[1px] bg-slate-200 mx-2" />
                            <span className="text-sm text-slate-500">Colaborador</span>
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                C
                            </div>
                        </div>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
