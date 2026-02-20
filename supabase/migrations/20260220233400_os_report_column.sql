-- Add report column for collaborator feedback
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS relatorio TEXT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
