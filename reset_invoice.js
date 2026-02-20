const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://ssfvlodfksbirqnuxfoa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZnZsb2Rma3NiaXJxbnV4Zm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYwMDczNCwiZXhwIjoyMDg3MTc2NzM0fQ.zl-39aitrsmfmuU9z-cm-JYfTipJiI4-yXfXVV-cUXY'
)

async function reset() {
    console.log('Resetting invoice...')
    const { data: f, error: fErr } = await supabase
        .from('facturas')
        .update({ estado: 'emitida', data_pagamento: null })
        .eq('numero', 'EXT202602/897')
        .select()

    if (fErr) console.error('Error updating invoice:', fErr)
    else console.log('Invoice reset:', f)

    const { error: tErr } = await supabase
        .from('transacoes_master')
        .delete()
        .eq('referencia_id', f[0]?.id)

    if (tErr) console.error('Error deleting transaction:', tErr)
    else console.log('Transaction cleaned up.')
}

reset()
