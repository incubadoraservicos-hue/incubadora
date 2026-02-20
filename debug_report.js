const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://ssfvlodfksbirqnuxfoa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZnZsb2Rma3NiaXJxbnV4Zm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYwMDczNCwiZXhwIjoyMDg3MTc2NzM0fQ.zl-39aitrsmfmuU9z-cm-JYfTipJiI4-yXfXVV-cUXY'
)

async function debugReport() {
    console.log('Testing column existence for relatorio...')
    const { error } = await supabase.from('ordens_servico').select('relatorio').limit(1)

    if (error) {
        console.log('ERROR:', error.message)
        console.log('HINT:', error.hint)
    } else {
        console.log('SUCCESS: Column relatorio exists and is visible.')
    }
}

debugReport()
