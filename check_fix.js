const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://ssfvlodfksbirqnuxfoa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZnZsb2Rma3NiaXJxbnV4Zm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYwMDczNCwiZXhwIjoyMDg3MTc2NzM0fQ.zl-39aitrsmfmuU9z-cm-JYfTipJiI4-yXfXVV-cUXY'
)

async function applyFix() {
    console.log('Verificando e corrigindo estrutura da tabela ordens_servico...')

    // SQL to add columns and reload cache
    const sql = `
    -- 1. Garantir que a coluna cliente_id existe
    ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id);
    
    -- 2. Garantir que a coluna despesas_adicionais existe
    ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS despesas_adicionais JSONB DEFAULT '[]'::jsonb;
    
    -- 3. Notificar o PostgREST para atualizar a cache
    NOTIFY pgrst, 'reload schema';
  `

    // Since we don't have a direct SQL runner in supabase-js, 
    // we try to perform a dummy insert with the column to see if it works or fails.
    // Actually, I'll use a trick: I'll try to select the column.

    const { error } = await supabase.from('ordens_servico').select('cliente_id').limit(1)

    if (error && error.message.includes('column "cliente_id" does not exist')) {
        console.error('ERRO: A coluna realmente não existe no Supabase.')
        console.log('Como não posso executar SQL arbitrário via JS sem uma function, por favor execute este SQL no SQL Editor do Supabase:')
        console.log('----------------------------------------------------')
        console.log(sql)
        console.log('----------------------------------------------------')
    } else if (error) {
        console.error('Erro ao verificar coluna:', error.message)
        console.log('A tentar forçar reload da cache com uma query de "wake up"...')
        await supabase.from('ordens_servico').select('*').limit(1)
    } else {
        console.log('SUCESSO: A coluna cliente_id já foi detectada na base de dados.')
        console.log('Se o erro persistir no seu browser, por favor limpe a cache ou use uma janela anónima.')
    }
}

applyFix()
