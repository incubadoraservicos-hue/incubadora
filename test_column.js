const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://ssfvlodfksbirqnuxfoa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZnZsb2Rma3NiaXJxbnV4Zm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYwMDczNCwiZXhwIjoyMDg3MTc2NzM0fQ.zl-39aitrsmfmuU9z-cm-JYfTipJiI4-yXfXVV-cUXY'
)

async function test() {
    const { error } = await supabase.from('ordens_servico').select('id, cliente_id').limit(1)
    if (error) {
        console.log('ERROR_MESSAGE:', error.message)
        console.log('ERROR_HINT:', error.hint)
        console.log('ERROR_DETAILS:', error.details)
    } else {
        console.log('SUCCESS: Column found.')
    }
}

test()
