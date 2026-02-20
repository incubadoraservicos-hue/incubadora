-- Create Servicos Table
create table if not exists public.servicos (
    id uuid primary key default uuid_generate_v4(),
    nome text not null,
    descricao text,
    preco_base numeric(12,2) not null,
    ativo boolean default true,
    created_at timestamptz default now()
);

-- Policy for Servicos
alter table public.servicos enable row level security;
create policy "Master full access on servicos" on public.servicos for all using (is_master());

-- Insert some default services
insert into public.servicos (nome, descricao, preco_base) values
('Consultoria Técnica', 'Serviço de consultoria em TI e infraestrutura', 5000.00),
('Desenvolvimento Customizado', 'Desenvolvimento de funcionalidades extra', 15000.00),
('Formação e Treinamento', 'Treinamento de pessoal no uso dos sistemas', 7500.00),
('Suporte On-site', 'Suporte técnico presencial', 3500.00);

-- Adicionar campo externa_url às facturas se não existir (ou usar pdf_url)
-- O campo pdf_url já existe, vamos usá-lo para a factura externa também.
