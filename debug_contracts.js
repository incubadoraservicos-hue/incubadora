const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://ssfvlodfksbirqnuxfoa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZnZsb2Rma3NiaXJxbnV4Zm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYwMDczNCwiZXhwIjoyMDg3MTc2NzM0fQ.zl-39aitrsmfmuU9z-cm-JYfTipJiI4-yXfXVV-cUXY'
)

async function debugContractTypes() {
    console.log('--- VERIFYING CONTRACT DATA ---')

    // 1. Get all contracts to see what's actually there
    const { data: contracts, error } = await supabase
        .from('contratos')
        .select('id, numero, tipo, estado, colaborador_id, descricao')

    if (error) {
        console.error('Error fetching contracts:', error.message)
        return
    }

    if (!contracts || contracts.length === 0) {
        console.log('Zero contracts found in the database.')
        return
    }

    console.log(`Found ${contracts.length} total contracts.`)

    contracts.forEach(c => {
        console.log(`- ID: ${c.id.substring(0, 8)}... | Num: ${c.numero} | Type: [${c.tipo}] | Status: ${c.estado} | ColabID: ${c.colaborador_id}`)
    })

    // 2. Check for type mismatch
    const mismatch = contracts.filter(c => c.tipo !== 'termo_compromisso' && c.tipo !== 'compromisso')
    if (mismatch.length > 0) {
        console.log('\nContract types that might NOT be showing up based on frontend filter:')
        mismatch.forEach(m => console.log(`  -> Type: ${m.tipo}`))
    }
}

debugContractTypes()
