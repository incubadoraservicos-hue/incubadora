-- Add balance to empresas
alter table public.empresas add column if not exists saldo decimal(15,2) default 0;

-- Function to handle service payment (conclude and pay)
create or replace function public.pay_colaborador(order_id uuid)
returns void as $$
declare
  val decimal(15,2);
  colab_id uuid;
begin
  -- Get order details
  select valor, colaborador_id into val, colab_id 
  from public.ordens_servico 
  where id = order_id;

  -- Update order status
  update public.ordens_servico set estado = 'paga' where id = order_id;

  -- Add to collaborator balance
  update public.colaboradores set saldo_pendente = saldo_pendente + val where id = colab_id;

  -- Deduct from master balance (assuming first company for now)
  update public.empresas set saldo = saldo - val where id = (select id from public.empresas limit 1);
end;
$$ language plpgsql security definer;
