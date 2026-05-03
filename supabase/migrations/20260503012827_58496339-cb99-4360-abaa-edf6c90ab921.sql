-- Adicionar coluna de localização se não existir
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS localizacao_gps JSONB;

-- Tabela de Auditoria
CREATE TABLE IF NOT EXISTS public.os_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    status_anterior TEXT,
    status_novo TEXT NOT NULL,
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Evidências
CREATE TABLE IF NOT EXISTS public.os_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    tipo TEXT CHECK (tipo IN ('foto', 'video')),
    url TEXT NOT NULL,
    metadata JSONB,
    localizacao JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para Auditoria
ALTER TABLE public.os_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auditoria visível para gestores e auditores" ON public.os_audit_logs
    FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor') OR public.has_role(auth.uid(), 'auditor'));

-- RLS para Evidências
ALTER TABLE public.os_evidences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Evidências visíveis para todos autenticados" ON public.os_evidences
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários inserem suas próprias evidências" ON public.os_evidences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('os-evidences', 'os-evidences', true) ON CONFLICT DO NOTHING;

-- Storage policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Arquivos públicos para leitura') THEN
        CREATE POLICY "Arquivos públicos para leitura" ON storage.objects FOR SELECT USING (bucket_id = 'os-evidences');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Upload de evidências por usuários autenticados') THEN
        CREATE POLICY "Upload de evidências por usuários autenticados" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'os-evidences' AND auth.role() = 'authenticated');
    END IF;
END $$;
