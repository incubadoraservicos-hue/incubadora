-- Add breakdown for mission costs
alter table public.ordens_servico 
add column if not exists valor_colaborador numeric(12,2) default 0,
add column if not exists despesas_adicionais jsonb default '[]'::jsonb;

-- Comment on what despesas_adicionais should contain:
-- [{ "tipo": "transporte", "valor": 500, "descricao": "Taxi para cliente" }, ...]

-- Update transacoes_master recording logic to use the Full Total of the mission
create or replace function public.on_os_paid_master_transaction()
returns trigger as $$
declare
    master_id uuid;
begin
    if new.estado = 'paga' and old.estado != 'paga' then
        -- Get any active master user ID or just use a generic reference
        select id into master_id from public.colaboradores limit 1; -- Fallback

        insert into public.transacoes_master (tipo, categoria, valor, descricao, referencia_id)
        values (
            'despesa', 
            'missao', 
            new.valor, -- The 'valor' column in OS should represent the total mission cost (Fee + Expenses)
            'Pagamento da Missão ' || new.numero || ' e despesas relacionadas',
            new.id
        );
    end if;
    return new;
end;
$$ language plpgsql security definer;
