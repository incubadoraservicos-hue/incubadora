-- Create a function to force-reload the schema cache
create or replace function public.reload_schema_cache()
returns void as $$
begin
  notify pgrst, 'reload schema';
end;
$$ language plpgsql security definer;

-- Add the column if it's missing (failsafe)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='cliente_id') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN cliente_id uuid REFERENCES public.clientes(id);
    END IF;
END $$;

-- Run the notify
select public.reload_schema_cache();
