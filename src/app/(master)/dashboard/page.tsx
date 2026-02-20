import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    FileText,
    Users,
    ClipboardList,
    AlertCircle
} from 'lucide-react'

export default function DashboardPage() {
    const stats = [
        { label: 'Facturas em Aberto', value: '0', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Clientes Activos', value: '0', icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'OS em Execução', value: '0', icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Alertas', value: '0', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-slate-500">Bem-vindo à sua plataforma de gestão empresarial.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                            <div className={`${stat.bg} ${stat.color} rounded-full p-2`}>
                                <stat.icon size={16} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Actividade Recente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-40 text-slate-400">
                            Nenhuma actividade registada.
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Alertas Próximos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-40 text-slate-400">
                            Sem alertas no momento.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
