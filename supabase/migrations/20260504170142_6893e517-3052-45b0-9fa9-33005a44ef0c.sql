ALTER TABLE public.ordens_servico
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS ponto_referencia TEXT,
ADD COLUMN IF NOT EXISTS solicitante_nome TEXT,
ADD COLUMN IF NOT EXISTS solicitante_telefone TEXT;

-- Garantir que a tabela de histórico (audit_logs) tenha espaço para comentários detalhados
ALTER TABLE public.os_audit_logs 
ALTER COLUMN comentario TYPE TEXT;
