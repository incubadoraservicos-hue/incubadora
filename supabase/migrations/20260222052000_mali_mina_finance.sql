-- Migration to add Mali Ya Mina and Financial Concepts (Wallets, Credits, Txuna)

-- 1. ADICIONAR ESTADO AO SERVIÇO MALI YA MINA NA TABELA EMPRESA
alter table public.empresas add column if not exists mali_mina_activo boolean default true;
alter table public.empresas add column if not exists config_financeira jsonb default '{
    "credito_max_colaborador": 5000,
    "saldo_min_colaborador": 1000,
    "juros_credito_base": 0.10,
    "juros_mali_mina": 0.30
}'::jsonb;

-- 2. TABELA DE CARTEIRAS (WALLETS)
create table if not exists public.carteiras (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    colaborador_id uuid references public.colaboradores(id) on delete cascade,
    tipo_proprietario text not null check (tipo_proprietario in ('master', 'colaborador', 'subscritor')),
    saldo_disponivel numeric(12,2) default 0,
    saldo_cativo numeric(12,2) default 0, -- Reservado para créditos/pagamentos pendentes
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id)
);

-- 3. TABELA DE SUBSCRITORES (MALI YA MINA)
create table if not exists public.mali_subscritores (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    nome text not null,
    email text unique not null,
    telefone text,
    estado text default 'activo' check (estado in ('activo', 'inactivo', 'pendente')),
    perfil jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- 4. TABELA DE CRÉDITOS
create table if not exists public.creditos (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    valor_solicitado numeric(12,2) not null,
    valor_aprovado numeric(12,2),
    taxa_juros numeric(5,2) not null, -- percentual (ex: 0.30 para 30%)
    total_a_pagar numeric(12,2),
    total_pago numeric(12,2) default 0,
    prazo_pagamento date,
    estado text default 'pendente' check (estado in ('pendente', 'aprovado', 'recusado', 'pago', 'atraso')),
    motivo_recusa text,
    data_aprovacao timestamptz,
    created_at timestamptz default now()
);

-- 5. TABELA DE GRUPOS (TXUNA & KU HUMELELA)
create table if not exists public.mali_grupos (
    id uuid primary key default uuid_generate_v4(),
    nome text not null,
    descricao text,
    tipo text not null check (tipo in ('txuna', 'ku_humelela')),
    valor_contribuicao numeric(12,2) not null,
    periodicidade text default 'mensal',
    juros_solicitacao numeric(5,2) default 0, -- específico para ku_humelela
    dia_contribuicao integer check (dia_contribuicao between 1 and 31),
    max_membros integer,
    estado text default 'activo' check (estado in ('activo', 'fechado', 'concluido')),
    created_at timestamptz default now()
);

-- 6. MEMBROS DOS GRUPOS
create table if not exists public.mali_grupo_membros (
    id uuid primary key default uuid_generate_v4(),
    grupo_id uuid references public.mali_grupos(id) on delete cascade,
    subscritor_id uuid references public.mali_subscritores(id) on delete cascade,
    posicao_recebimento integer, -- para txuna, quem recebe em qual mes
    data_adesao date default current_date,
    unique(grupo_id, subscritor_id)
);

-- 7. TRANSAÇÕES FINANCEIRAS (Histórico da Carteira)
create table if not exists public.transacoes_carteira (
    id uuid primary key default uuid_generate_v4(),
    carteira_id uuid references public.carteiras(id) on delete cascade,
    tipo text not null check (tipo in ('deposito', 'levantamento', 'transferencia', 'credito', 'pagamento_credito', 'contribuicao_grupo', 'recebimento_grupo', 'juros')),
    valor numeric(12,2) not null,
    descricao text,
    referencia_id uuid, -- ID do crédito, missão, ou grupo relacionado
    created_at timestamptz default now()
);

-- RLS POLICIES

alter table public.carteiras enable row level security;
create policy "Users see their own wallet" on public.carteiras for select using (auth.uid() = user_id or is_master());

alter table public.mali_subscritores enable row level security;
create policy "Master see all subscribers" on public.mali_subscritores for select using (is_master());
create policy "Subscribers see self" on public.mali_subscritores for select using (auth.uid() = user_id);

alter table public.creditos enable row level security;
create policy "Users see own credits" on public.creditos for select using (auth.uid() = user_id or is_master());
create policy "Users request credits" on public.creditos for insert with check (auth.uid() = user_id);
create policy "Master update credits" on public.creditos for update using (is_master());

alter table public.mali_grupos enable row level security;
create policy "Anyone active can see groups" on public.mali_grupos for select using (true);
create policy "Master manage groups" on public.mali_grupos for all using (is_master());

alter table public.mali_grupo_membros enable row level security;
create policy "Members see their groups" on public.mali_grupo_membros for select using (true);

alter table public.transacoes_carteira enable row level security;
create policy "Users see own transactions" on public.transacoes_carteira for select 
using (carteira_id in (select id from public.carteiras where user_id = auth.uid()) or is_master());

-- FUNÇÕES AUXILIARES

-- TRIGGER PARA CRIAR CARTEIRA AO CRIAR COLABORADOR OU SUBSCRITOR
create or replace function public.handle_new_wallet()
returns trigger as $$
begin
  insert into public.carteiras (user_id, colaborador_id, tipo_proprietario)
  values (new.user_id, 
          case when tg_table_name = 'colaboradores' then new.id else null end,
          case when tg_table_name = 'colaboradores' then 'colaborador' else 'subscritor' end);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_colaborador_created
  after insert on public.colaboradores
  for each row execute procedure public.handle_new_wallet();

create trigger on_subscritor_created
  after insert on public.mali_subscritores
  for each row execute procedure public.handle_new_wallet();

-- VINCULAR CONTRATOS AO MASTER TAMBÉM (VIA PDF_URL DISPONÍVEL NA TABELA)
-- Nota: A tabela contratos já tem pdf_url e é visível ao master via RLS.
