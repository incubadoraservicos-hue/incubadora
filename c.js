const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://ssfvlodfksbirqnuxfoa.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZnZsb2Rma3NiaXJxbnV4Zm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYwMDczNCwiZXhwIjoyMDg3MTc2NzM0fQ.zl-39aitrsmfmuU9z-cm-JYfTipJiI4-yXfXVV-cUXY')
async function f() {
    const { data: c } = await supabase.from('colaboradores').select('nome, email, user_id').eq('id', '3e6e4729-176c-4f96-b749-856ee8839aa5').single()
    console.log('C:' + JSON.stringify(c))
}
f()
