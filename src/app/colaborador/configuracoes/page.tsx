'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { KeyRound, ShieldCheck, AlertTriangle } from 'lucide-react'

export default function CollaboratorSettingsPage() {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem')
            return
        }

        if (newPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error

            toast.success('Senha actualizada com sucesso!')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            toast.error(error.message || 'Erro ao actualizar senha')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
                <p className="text-slate-500">Gerencie a sua conta e segurança.</p>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-indigo-600" />
                        <CardTitle>Alterar Senha</CardTitle>
                    </div>
                    <CardDescription>
                        Recomendamos o uso de uma senha forte para proteger a sua conta.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdatePassword}>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3 mb-4">
                            <AlertTriangle className="text-amber-600 h-5 w-5 mt-0.5" />
                            <div className="text-sm text-amber-900">
                                <p className="font-bold">Aviso de Segurança</p>
                                <p>Se a sua conta foi criada com a senha padrão "123", por favor altere-a imediatamente.</p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="new-password">Nova Senha</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Pelo menos 6 caracteres"
                                required
                                className="bg-slate-50"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repita a nova senha"
                                required
                                className="bg-slate-50"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 flex justify-end p-4 border-t">
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                            {loading ? 'A guardar...' : <><ShieldCheck className="mr-2 h-4 w-4" /> Actualizar Senha</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <div className="text-center pt-10">
                <p className="text-xs text-slate-400 uppercase tracking-widest">
                    Segurança garantida por Incubadora de Soluções
                </p>
            </div>
        </div>
    )
}
