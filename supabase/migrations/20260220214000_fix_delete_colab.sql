-- Add on delete cascade to contracts to allow collaborator deletion
alter table public.contratos 
drop constraint if exists contratos_colaborador_id_fkey,
add constraint contratos_colaborador_id_fkey 
  foreign key (colaborador_id) 
  references public.colaboradores(id) 
  on delete cascade;

-- Ensure OS also has it (just in case)
alter table public.ordens_servico 
drop constraint if exists ordens_servico_colaborador_id_fkey,
add constraint ordens_servico_colaborador_id_fkey 
  foreign key (colaborador_id) 
  references public.colaboradores(id) 
  on delete cascade;
