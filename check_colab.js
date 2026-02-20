const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://ssfvlodfksbirqnuxfoa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZnZsb2Rma3NiaXJxbnV4Zm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYwMDczNCwiZXhwIjoyMDg3MTc2NzM0fQ.zl-39aitrsmfmuU9z-cm-JYfTipJiI4-yXfXVV-cUXY'
)

async function checkColabLink() {
    const { data: colabs } = await supabase.from('colaboradores').select('id, nome, email, user_id')
    console.log('--- COLABORADORES LINK STATUS ---')
    colabs?.forEach(c => {
        console.log(`Nome: ${c.nome}, Email: ${c.email}, UserID: ${c.user_id || 'NULO (RLS vai bloquear!)'}`)
    })
}

checkColabLink()
