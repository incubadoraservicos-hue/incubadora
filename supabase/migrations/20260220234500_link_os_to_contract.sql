-- 1. ADICIONAR LINK COM ORDEM DE SERVIÇO
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS ordem_servico_id uuid REFERENCES public.ordens_servico(id);

-- 2. CORREÇÃO DOS TIPOS DE CONTRATO
-- Atualiza termos antigos que ficaram com o tipo 'compromisso' para o novo padrão
UPDATE public.contratos 
SET tipo = 'termo_compromisso' 
WHERE tipo = 'compromisso';

-- 3. GARANTIR QUE A COLUNA DESCRICAO EXISTE (Caso não tenha rodado antes)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratos' AND column_name='descricao') THEN
        ALTER TABLE public.contratos ADD COLUMN descricao TEXT;
    END IF;
END $$;

-- 4. RECARREGAR SCHEMAS
NOTIFY pgrst, 'reload schema';
