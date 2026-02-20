-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. EMPRESAS (Master Data)
create table if not exists public.empresas (
    id uuid primary key default uuid_generate_v4(),
    nome text not null,
    nuit text,
    endereco text,
    telefone text,
    email text,
    logo_url text,
    banco text,
    conta_bancaria text,
    iban text,
    created_at timestamptz default now()
);

-- 2. CLIENTES
create table if not exists public.clientes (
    id uuid primary key default uuid_generate_v4(),
    nome text not null,
    nuit text,
    email text,
    telefone text,
    endereco text,
    representante text,
    banco text,
    conta_bancaria text,
    estado text default 'activo' check (estado in ('activo', 'inactivo', 'suspenso')),
    created_at timestamptz default now()
);

-- 3. SISTEMAS (SaaS Products)
create table if not exists public.sistemas (
    id uuid primary key default uuid_generate_v4(),
    nome text not null,
    descricao text,
    versao text,
    tipo_licenca text check (tipo_licenca in ('mensal', 'anual', 'unico', 'projecto')),
    valor_base numeric(12,2),
    modulos jsonb default '[]'::jsonb,
    ativo boolean default true,
    created_at timestamptz default now()
);

-- 4. LICENCAS
create table if not exists public.licencas (
    id uuid primary key default uuid_generate_v4(),
    cliente_id uuid references public.clientes(id) on delete cascade,
    sistema_id uuid references public.sistemas(id) on delete cascade,
    data_inicio date not null default current_date,
    data_fim date,
    valor numeric(12,2),
    estado text default 'activa' check (estado in ('activa', 'expirada', 'suspensa', 'cancelada')),
    created_at timestamptz default now()
);

-- 5. COLABORADORES
create table if not exists public.colaboradores (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    nome text not null,
    bi_passaporte text,
    email text unique,
    telefone text,
    especialidades text[] default '{}',
    estado text default 'activo' check (estado in ('activo', 'inactivo', 'suspenso')),
    termo_sigilo_assinado boolean default false,
    data_termo_sigilo date,
    saldo_pendente numeric(12,2) default 0,
    created_at timestamptz default now()
);

-- 6. FACTURAS
create table if not exists public.facturas (
    id uuid primary key default uuid_generate_v4(),
    numero text unique not null,
    cliente_id uuid references public.clientes(id),
    empresa_id uuid references public.empresas(id),
    data_emissao date not null default current_date,
    data_vencimento date,
    linhas jsonb not null default '[]'::jsonb,
    subtotal numeric(12,2) not null,
    iva_total numeric(12,2) not null,
    total numeric(12,2) not null,
    estado text default 'rascunho' check (estado in ('rascunho', 'emitida', 'enviada', 'paga', 'em_atraso', 'cancelada')),
    data_pagamento date,
    notas text,
    pdf_url text,
    created_at timestamptz default now()
);

-- 7. CONTRATOS
create table if not exists public.contratos (
    id uuid primary key default uuid_generate_v4(),
    numero text unique not null,
    tipo text check (tipo in ('fornecedor_cliente', 'incubadora_prestador', 'compromisso')),
    cliente_id uuid references public.clientes(id),
    colaborador_id uuid references public.colaboradores(id),
    sistema_id uuid references public.sistemas(id),
    objeto text,
    valor numeric(12,2),
    data_inicio date not null default current_date,
    data_fim date,
    estado text default 'rascunho' check (estado in ('rascunho', 'activo', 'expirado', 'rescindido')),
    clausulas jsonb default '[]'::jsonb,
    pdf_url text,
    created_at timestamptz default now()
);

-- 8. ORDENS DE SERVICO
create table if not exists public.ordens_servico (
    id uuid primary key default uuid_generate_v4(),
    numero text unique not null,
    colaborador_id uuid references public.colaboradores(id) on delete cascade,
    descricao text not null,
    valor numeric(12,2) not null,
    prazo date,
    estado text default 'enviada' check (estado in ('enviada', 'confirmada', 'em_execucao', 'concluida', 'paga', 'cancelada')),
    data_confirmacao timestamptz,
    data_conclusao timestamptz,
    data_pagamento timestamptz,
    metodo_pagamento text,
    referencia_pagamento text,
    notas_master text,
    notas_colaborador text,
    created_at timestamptz default now()
);

-- 9. DOCUMENTOS EXTERNOS
create table if not exists public.documentos_externos (
    id uuid primary key default uuid_generate_v4(),
    titulo text not null,
    descricao text,
    ficheiro_url text not null,
    tipo_ficheiro text,
    created_at timestamptz default now()
);

-- 10. DOCUMENTOS DESTINATARIOS
create table if not exists public.documentos_destinatarios (
    id uuid primary key default uuid_generate_v4(),
    documento_id uuid references public.documentos_externos(id) on delete cascade,
    colaborador_id uuid references public.colaboradores(id) on delete cascade,
    lido boolean default false,
    data_leitura timestamptz,
    unique(documento_id, colaborador_id)
);

-- 11. NOTIFICACOES
create table if not exists public.notificacoes (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    tipo text not null,
    titulo text not null,
    mensagem text not null,
    lida boolean default false,
    referencia_id uuid,
    created_at timestamptz default now()
);

-- 12. AUDITORIA
create table if not exists public.auditoria (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    accao text not null,
    tabela text not null,
    registo_id uuid,
    dados_anteriores jsonb,
    dados_novos jsonb,
    created_at timestamptz default now()
);

-- RLS POLICIES

-- Helper function to check if user is Master
create or replace function public.is_master()
returns boolean as $$
begin
  return (auth.jwt() ->> 'email') = 'afonso.pene@incubadora.co.mz' 
         OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'master';
end;
$$ language plpgsql security definer;

-- Empresas: Master only
alter table public.empresas enable row level security;
create policy "Master full access on empresas" on public.empresas for all using (is_master());

-- Clientes: Master only
alter table public.clientes enable row level security;
create policy "Master full access on clientes" on public.clientes for all using (is_master());

-- Sistemas: Master only
alter table public.sistemas enable row level security;
create policy "Master full access on sistemas" on public.sistemas for all using (is_master());

-- Licencas: Master only
alter table public.licencas enable row level security;
create policy "Master full access on licencas" on public.licencas for all using (is_master());

-- Colaboradores: Master full access, Colaborador read self
alter table public.colaboradores enable row level security;
create policy "Master full access on colaboradores" on public.colaboradores for all using (is_master());
create policy "Colaborador read self" on public.colaboradores for select using (auth.uid() = user_id);

-- Facturas: Master only
alter table public.facturas enable row level security;
create policy "Master full access on facturas" on public.facturas for all using (is_master());

-- Contratos: Master only (or Colaborador see their own)
alter table public.contratos enable row level security;
create policy "Master full access on contratos" on public.contratos for all using (is_master());
create policy "Colaborador see their own contracts" on public.contratos for select 
using (colaborador_id in (select id from public.colaboradores where user_id = auth.uid()));

-- Ordens de Servico: Master full access, Colaborador see/update their own
alter table public.ordens_servico enable row level security;
create policy "Master full access on ordens_servico" on public.ordens_servico for all using (is_master());
create policy "Colaborador see their own OS" on public.ordens_servico for select 
using (colaborador_id in (select id from public.colaboradores where user_id = auth.uid()));
create policy "Colaborador update their own OS status" on public.ordens_servico for update
using (colaborador_id in (select id from public.colaboradores where user_id = auth.uid()))
with check (colaborador_id in (select id from public.colaboradores where user_id = auth.uid()));

-- Documentos Externos: Master full access, Colaborador see if recipient
alter table public.documentos_externos enable row level security;
create policy "Master full access on documentos_externos" on public.documentos_externos for all using (is_master());
create policy "Colaborador see assigned documents" on public.documentos_externos for select
using (id in (
    select documento_id from public.documentos_destinatarios 
    where colaborador_id in (select id from public.colaboradores where user_id = auth.uid())
));

-- Documentos Destinatarios: Master full access, Colaborador update lido
alter table public.documentos_destinatarios enable row level security;
create policy "Master full access on documentos_destinatarios" on public.documentos_destinatarios for all using (is_master());
create policy "Colaborador see/update their reception" on public.documentos_destinatarios for select
using (colaborador_id in (select id from public.colaboradores where user_id = auth.uid()));
create policy "Colaborador ack reception" on public.documentos_destinatarios for update
using (colaborador_id in (select id from public.colaboradores where user_id = auth.uid()))
with check (colaborador_id in (select id from public.colaboradores where user_id = auth.uid()));

-- Notificacoes: Master see all, Colaborador see their own
alter table public.notificacoes enable row level security;
create policy "Users see their own notifications" on public.notificacoes for all 
using (auth.uid() = user_id or is_master());

-- Auditoria: Master only
alter table public.auditoria enable row level security;
create policy "Master read only auditoria" on public.auditoria for select using (is_master());
