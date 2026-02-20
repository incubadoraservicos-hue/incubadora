-- Add cliente_id to ordens_servico
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id);
