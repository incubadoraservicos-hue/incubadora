import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowRight, Wallet, ShieldCheck, Sparkles, LogIn } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: empresa } = await supabase.from('empresas').select('mali_mina_activo').single()
  const { data: { user } } = await supabase.auth.getUser()

  const isMaliActive = empresa?.mali_mina_activo ?? true

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-slate-950 text-white">
      {/* Background Image with Transparency Effect */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/landing.png"
          alt="Background"
          fill
          className="object-cover opacity-30 scale-105 transition-transform duration-[10s] hover:scale-100"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Incubadora <span className="text-indigo-400">Hub</span></span>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/master/dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/10">Entrar no Painel</Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            Novas funcionalidades financeiras disponíveis
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Gestão Inteligente & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Liberdade Financeira
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A plataforma completa para gestão de sistemas SaaS, colaboradores e agora com o exclusivo serviço
            <span className="text-white font-semibold"> Mali Ya Mina</span> para o seu crescimento financeiro.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/mali-ya-mina">
              <Button size="lg" className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 group">
                Conhecer Mali Ya Mina
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            {!isMaliActive && (
              <p className="text-rose-400 text-sm font-medium pt-2">
                ⚠️ Neste momento o serviço Mali Ya Mina está indisponível.
              </p>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Segurança Total</h3>
            <p className="text-slate-400 text-sm">Contratos blindados e gestão de sigilo absoluta com a Incubadora.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
              <Wallet className="text-purple-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Carteira Digital</h3>
            <p className="text-slate-400 text-sm">Aceda ao seu saldo, solicite créditos e gira as suas poupanças.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
              <Sparkles className="text-pink-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Txuna & Xitique</h3>
            <p className="text-slate-400 text-sm">Participe em grupos de poupança mútua e receba mensalmente.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-10 border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">© 2026 Incubadora de Soluções. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6 text-slate-400 text-xs">
            <Link href="/termos" className="hover:text-white">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
            <Link href="/suporte" className="hover:text-white">Suporte</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
