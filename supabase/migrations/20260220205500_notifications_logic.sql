-- Add notifications on payment events
create or replace function public.on_invoice_paid_notify()
returns trigger as $$
declare
  master_id uuid;
begin
  if (new.estado = 'paga' and (old.estado is null or old.estado != 'paga')) then
    -- Get some master user id (usually the first one or specifically the one with role master)
    select id into master_id from auth.users where (raw_user_meta_data->>'role') = 'master' or email = 'afonso.pene@incubadora.co.mz' limit 1;
    
    insert into public.notificacoes (user_id, tipo, titulo, mensagem, referencia_id)
    values (master_id, 'pagamento_recebido', 'Pagamento Recebido!', 'A factura ' || new.numero || ' de ' || new.total || ' MT foi liquidada pelos clientes.', new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger tr_invoice_paid_notify
after update on public.facturas
for each row execute function public.on_invoice_paid_notify();

-- Notifications for collaborators
create or replace function public.on_os_paid_notify()
returns trigger as $$
declare
  colab_user_id uuid;
begin
  if (new.estado = 'paga' and (old.estado is null or old.estado != 'paga')) then
    select user_id into colab_user_id from public.colaboradores where id = new.colaborador_id;
    
    insert into public.notificacoes (user_id, tipo, titulo, mensagem, referencia_id)
    values (colab_user_id, 'pagamento_disponivel', 'Novo Saldo Disponível!', 'O pagamento de ' || new.valor || ' MT referente à missão ' || new.numero || ' foi processado.', new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger tr_os_paid_notify
after update on public.ordens_servico
for each row execute function public.on_os_paid_notify();
