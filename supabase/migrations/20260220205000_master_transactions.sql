-- Create Transacoes Table for Master Balance tracking
create table if not exists public.transacoes_master (
    id uuid primary key default uuid_generate_v4(),
    tipo text not null check (tipo in ('receita', 'despesa', 'ajuste')),
    categoria text not null, -- ex: 'factura', 'pagamento_colaborador', 'infraestrutura'
    valor numeric(12,2) not null,
    descricao text,
    referencia_id uuid, -- ID da factura ou OS relacionada
    data_transacao timestamptz default now(),
    created_at timestamptz default now()
);

-- Policy for Transacoes Master
alter table public.transacoes_master enable row level security;
create policy "Master full access on transacoes_master" on public.transacoes_master for all using (is_master());

-- Function to update Master balance on Invoice Payment
create or replace function public.on_invoice_paid()
returns trigger as $$
begin
  if (new.estado = 'paga' and (old.estado is null or old.estado != 'paga')) then
    insert into public.transacoes_master (tipo, categoria, valor, descricao, referencia_id)
    values ('receita', 'factura', new.total, 'Recebimento de Factura: ' || new.numero, new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for Invoice Payment
create trigger tr_invoice_paid
after update on public.facturas
for each row execute function public.on_invoice_paid();

-- Update pay_colaborador to also record in transacoes_master
create or replace function public.pay_colaborador(order_id uuid)
returns void as $$
declare
  val decimal(15,2);
  colab_id uuid;
  os_num text;
begin
  -- Get order details
  select valor, colaborador_id, numero into val, colab_id, os_num
  from public.ordens_servico 
  where id = order_id;

  -- Update order status
  update public.ordens_servico set estado = 'paga' where id = order_id;

  -- Add to collaborator balance (already handled if we maintain colaborador logic)
  update public.colaboradores set saldo_pendente = saldo_pendente + val where id = colab_id;

  -- Record expense for Master
  insert into public.transacoes_master (tipo, categoria, valor, descricao, referencia_id)
  values ('despesa', 'pagamento_colaborador', val, 'Pagamento Missão: ' || os_num, order_id);
end;
$$ language plpgsql security definer;
