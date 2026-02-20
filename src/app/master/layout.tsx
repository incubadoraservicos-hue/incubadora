import { Sidebar } from '@/components/Sidebar'

export default function MasterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <main className="pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white px-8 shadow-sm">
                    <div className="flex flex-1 items-center justify-between">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">PLATAFORMA GESTÃO</h1>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500">Afonso Pene (Master)</span>
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                AP
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
