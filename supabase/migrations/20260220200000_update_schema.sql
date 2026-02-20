-- Add report field to ordens_servico
alter table public.ordens_servico add column if not exists relatorio text;

-- Add external invoice support to facturas
alter table public.facturas add column if not exists externa boolean default false;
alter table public.facturas add column if not exists ficheiro_externo_url text;

-- Update empresas to hold multiple banking details (for the invoice design)
alter table public.empresas add column if not exists dados_bancarios jsonb default '[]'::jsonb;

-- Ensure the is_master logic includes the specific email provided
create or replace function public.is_master()
returns boolean as $$
begin
  return (auth.jwt() ->> 'email') = 'incubadoraservicos@gmail.com' 
         OR (auth.jwt() ->> 'email') = 'afonso.pene@incubadora.co.mz'
         OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'master';
end;
$$ language plpgsql security definer;
