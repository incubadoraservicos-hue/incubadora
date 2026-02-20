-- Create Licencas Table for SaaS Offline activation
create table if not exists public.licencas (
    id uuid primary key default uuid_generate_v4(),
    sistema_id uuid references public.sistemas(id) on delete cascade,
    cliente_id uuid references public.clientes(id) on delete cascade,
    chave_licenca text unique not null,
    data_emissao timestamptz default now(),
    data_expiracao date not null,
    metadata jsonb default '{}'::jsonb, -- Store hardware ID, machine name, etc.
    created_at timestamptz default now()
);

-- Policy for Licencas
alter table public.licencas enable row level security;
create policy "Master full access on licencas" on public.licencas for all using (is_master());
