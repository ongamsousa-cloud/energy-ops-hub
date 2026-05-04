-- Adicionar coluna de arquivamento se não existir
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS arquivada BOOLEAN DEFAULT false;

-- Atualizar o check constraint de operational_status para incluir 'aguardando_aceite' se necessário
-- (Nota: se for uma coluna TEXT simples, não precisa de alteração no tipo, mas vamos garantir que o padrão seja 'pendente')
ALTER TABLE public.ordens_servico ALTER COLUMN operational_status SET DEFAULT 'pendente';

-- Criar um índice para melhorar a performance dos filtros de data e status
CREATE INDEX IF NOT EXISTS idx_os_operational_status ON public.ordens_servico(operational_status);
CREATE INDEX IF NOT EXISTS idx_os_created_at ON public.ordens_servico(created_at);
CREATE INDEX IF NOT EXISTS idx_os_department_id ON public.ordens_servico(department_id);
