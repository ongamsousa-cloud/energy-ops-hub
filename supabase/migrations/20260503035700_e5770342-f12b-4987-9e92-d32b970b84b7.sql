-- Adicionar colunas de hierarquia na OS se não existirem
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='ordens_servico' AND column_name='assigned_supervisor_id') THEN
    ALTER TABLE public.ordens_servico ADD COLUMN assigned_supervisor_id UUID REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='ordens_servico' AND column_name='assigned_manager_id') THEN
    ALTER TABLE public.ordens_servico ADD COLUMN assigned_manager_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Tabela de Mensagens Operacionais (Chat Interno da OS)
CREATE TABLE IF NOT EXISTS public.os_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.os_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para Mensagens (Corrigido para usar a coluna 'cargo' da tabela 'profiles')
CREATE POLICY "Users can view messages of their OS" ON public.os_messages
    FOR SELECT USING (
        auth.uid() IN (
            SELECT profissional_id FROM public.ordens_servico WHERE id = os_id
            UNION
            SELECT assigned_supervisor_id FROM public.ordens_servico WHERE id = os_id
            UNION
            SELECT assigned_manager_id FROM public.ordens_servico WHERE id = os_id
            UNION
            SELECT id FROM public.profiles WHERE (cargo IN ('admin', 'gestor')) AND id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to their OS" ON public.os_messages
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT profissional_id FROM public.ordens_servico WHERE id = os_id
            UNION
            SELECT assigned_supervisor_id FROM public.ordens_servico WHERE id = os_id
            UNION
            SELECT assigned_manager_id FROM public.ordens_servico WHERE id = os_id
            UNION
            SELECT id FROM public.profiles WHERE (cargo IN ('admin', 'gestor')) AND id = auth.uid()
        )
    );

-- Garantir que a tabela de evidências tenha metadados de auditoria
ALTER TABLE public.os_evidences ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.os_evidences ADD COLUMN IF NOT EXISTS audit_verified BOOLEAN DEFAULT false;

-- Trigger para impedir exclusão física de evidências
CREATE OR REPLACE FUNCTION public.prevent_evidence_deletion()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Exclusão física de evidências não é permitida. Use exclusão lógica (deleted_at).';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_evidence_deletion ON public.os_evidences;
CREATE TRIGGER tr_prevent_evidence_deletion
BEFORE DELETE ON public.os_evidences
FOR EACH ROW EXECUTE FUNCTION public.prevent_evidence_deletion();
