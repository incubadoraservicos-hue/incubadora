-- Adicionar coluna para o token de notificações
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Criar tabela de notificações enviadas (opcional, mas bom para histórico)
CREATE TABLE IF NOT EXISTS notificacoes_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    titulo TEXT,
    mensagem TEXT,
    estado TEXT DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
