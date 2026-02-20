const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://ssfvlodfksbirqnuxfoa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZnZsb2Rma3NiaXJxbnV4Zm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYwMDczNCwiZXhwIjoyMDg3MTc2NzM0fQ.zl-39aitrsmfmuU9z-cm-JYfTipJiI4-yXfXVV-cUXY'
)

async function checkTerms() {
    console.log('--- RELATÓRIO DE TERMOS DE COMPROMISSO ---')

    // 1. Verificar quantos termos existem no total
    const { data: allTerms, error: totalError } = await supabase
        .from('contratos')
        .select('id, numero, tipo, estado, colaborador_id, descricao')

    if (totalError) {
        console.error('Erro ao ler tabela contratos:', totalError.message)
        return
    }

    console.log(`Total de registos na tabela contratos: ${allTerms?.length || 0}`)

    const termsByTipo = allTerms?.filter(t => t.tipo === 'termo_compromisso') || []
    console.log(`Registos com tipo = 'termo_compromisso': ${termsByTipo.length}`)

    if (termsByTipo.length > 0) {
        termsByTipo.forEach(t => {
            console.log(`- Termo ${t.numero}: Status=${t.estado}, ColabID=${t.colaborador_id}`)
        })
    } else {
        console.log('AVISO: Não foi encontrado nenhum termo com o tipo exato "termo_compromisso".')
        const otherTypes = [...new Set(allTerms?.map(t => t.tipo))]
        console.log('Tipos existentes na base de dados:', otherTypes)
    }

    // 2. Verificar o colaborador logado (exemplo rápido)
    console.log('\n--- VERIFICAÇÃO DE COLABORADORES ---')
    const { data: colabs } = await supabase.from('colaboradores').select('id, nome, email')
    colabs?.forEach(c => {
        const hisTerms = termsByTipo.filter(t => t.colaborador_id === c.id)
        console.log(`Colab: ${c.nome} (${c.email}) - Termos: ${hisTerms.length}`)
    })
}

checkTerms()
