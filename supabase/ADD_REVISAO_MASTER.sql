-- Add revisao_master to ordens_servico
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS revisao_master text;
