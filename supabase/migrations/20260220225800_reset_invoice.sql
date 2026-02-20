-- Reset the status of the invoice that was marked as paid by mistake
update public.facturas 
set estado = 'emitida', 
    data_pagamento = null 
where numero = 'EXT202602/897';

-- Delete the transaction if it exist (just to be clean)
delete from public.transacoes_master 
where referencia_id in (select id from public.facturas where numero = 'EXT202602/897');
