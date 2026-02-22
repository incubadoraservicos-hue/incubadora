-- FIX FOR MALI YA MINA AND MASTER FINANCIALS (v2)
-- Run this in your Supabase SQL Editor

-- 1. Ensure transacoes_master exists and has RLS
CREATE TABLE IF NOT EXISTS public.transacoes_master (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo text NOT NULL CHECK (tipo IN ('receita', 'despesa', 'ajuste')),
    categoria text NOT NULL,
    valor numeric(12,2) NOT NULL,
    descricao text,
    referencia_id uuid,
    data_transacao timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.transacoes_master ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Master full access on transacoes_master') THEN
        CREATE POLICY "Master full access on transacoes_master" ON public.transacoes_master FOR ALL USING (public.is_master());
    END IF;
END $$;

-- 2. Ensure at least one Empresa exists
INSERT INTO public.empresas (nome, mali_mina_activo, config_financeira)
SELECT 'Incubadora de Soluções', true, '{
    "credito_max_colaborador": 5000,
    "saldo_min_colaborador": 1000,
    "juros_credito_base": 0.10,
    "juros_mali_mina": 0.30,
    "capital_min_ativacao": 25000,
    "juros_credito_subscritor": 0.25,
    "percentagem_max_reserva": 0.15
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.empresas);

-- 3. Force schema cache reload (Static comment to avoid syntax error)
COMMENT ON TABLE public.transacoes_master IS 'Master Transactions Log - Re-sync Triggered';

-- 4. Verify/Re-link Invoice Paid Trigger if missing
CREATE OR REPLACE FUNCTION public.on_invoice_paid()
RETURNS trigger AS $$
BEGIN
  IF (new.estado = 'paga' AND (old.estado IS NULL OR old.estado != 'paga')) THEN
    INSERT INTO public.transacoes_master (tipo, categoria, valor, descricao, referencia_id)
    values ('receita', 'factura', new.total, 'Recebimento de Factura: ' || new.numero, new.id);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_invoice_paid ON public.facturas;
CREATE TRIGGER tr_invoice_paid
AFTER UPDATE ON public.facturas
FOR EACH ROW EXECUTE FUNCTION public.on_invoice_paid();
