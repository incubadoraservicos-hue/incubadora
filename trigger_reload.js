const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://ssfvlodfksbirqnuxfoa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZnZsb2Rma3NiaXJxbnV4Zm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYwMDczNCwiZXhwIjoyMDg3MTc2NzM0fQ.zl-39aitrsmfmuU9z-cm-JYfTipJiI4-yXfXVV-cUXY'
)

async function reload() {
    console.log('Sending reload signal to PostgREST...')
    // We try to call the function we just defined in the migration. 
    // If the migration wasn't applied yet, this might fail, but it's worth a shot.
    const { error } = await supabase.rpc('reload_schema_cache')

    if (error) {
        console.log('RPC failed (maybe migration not applied yet), trying a simple query to wake up the server...')
        await supabase.from('ordens_servico').select('id').limit(1)
    } else {
        console.log('Signal sent successfully!')
    }
}

reload()
