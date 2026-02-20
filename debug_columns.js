const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://ssfvlodfksbirqnuxfoa.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZnZsb2Rma3NiaXJxbnV4Zm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYwMDczNCwiZXhwIjoyMDg3MTc2NzM0fQ.zl-39aitrsmfmuU9z-cm-JYfTipJiI4-yXfXVV-cUXY')

async function checkColumns() {
    const { data, error } = await supabase.from('ordens_servico').select('*').limit(1)
    if (data && data.length > 0) {
        console.log('Colunas de ordens_servico:', Object.keys(data[0]))
        console.log('Exemplo de registo:', JSON.stringify(data[0], null, 2))
    } else {
        console.log('Nenhuma OS encontrada ou erro:', error)
    }
}
checkColumns()
