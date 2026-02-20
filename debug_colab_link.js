const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://ssfvlodfksbirqnuxfoa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZnZsb2Rma3NiaXJxbnV4Zm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYwMDczNCwiZXhwIjoyMDg3MTc2NzM0fQ.zl-39aitrsmfmuU9z-cm-JYfTipJiI4-yXfXVV-cUXY'
)

async function debugColabDetails() {
    const colabId = '3e6e4729-176c-4f96-b749-856ee8839aa5'
    console.log(`Checking details for Colaborador ID: ${colabId}`)

    const { data: colab, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('id', colabId)
        .single()

    if (error) {
        console.error('Error:', error.message)
        return
    }

    console.log('Record found:')
    console.log(`Nome: ${colab.nome}`)
    console.log(`Email: ${colab.email}`)
    console.log(`user_id: ${colab.user_id}`)

    if (!colab.user_id) {
        console.log('PROBLEM: user_id is NULL. RLS will block this collaborator.')

        // Let's see if there is an auth user with this email
        const { data: { users }, error: authError } = await (async () => {
            // We need admin access to list users, creating a temporary client with service role isn't easy here without re-specifying everything
            // But I'll try to find if a user exists by attempting a mock fetch or something if I had permission
            return { data: { users: [] }, error: null }
        })()
    }
}

debugColabDetails()
