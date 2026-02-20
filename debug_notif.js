const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://ssfvlodfksbirqnuxfoa.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZnZsb2Rma3NiaXJxbnV4Zm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYwMDczNCwiZXhwIjoyMDg3MTc2NzM0fQ.zl-39aitrsmfmuU9z-cm-JYfTipJiI4-yXfXVV-cUXY')

async function checkNotifications() {
    const { data: n, error } = await supabase.from('notificacoes').select('*').order('created_at', { ascending: false }).limit(5)
    console.log('Notificações:', JSON.stringify(n, null, 2))

    const { data: c } = await supabase.from('colaboradores').select('nome, user_id').eq('nome', 'TESTE').single()
    console.log('Colaborador TESTE:', JSON.stringify(c, null, 2))
}
checkNotifications()
