-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Also ensure the column exists (just in case)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='despesas_adicionais') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN despesas_adicionais JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
