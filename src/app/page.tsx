import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const role = user.user_metadata?.role

  if (role === 'master' || user.email === 'incubadoraservicos@gmail.com') {
    redirect('/master/dashboard')
  } else {
    redirect('/colaborador/minhas-os')
  }
}
