-- Departamentos
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar colunas em profiles para suporte administrativo
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS documento TEXT,
ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

-- Equipes (Melhoria da tabela existente ou criação se não houver)
-- Nota: Verificando se 'equipes' já existe para evitar conflitos, mas garantindo colunas do PRD
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'equipes') THEN
        CREATE TABLE public.equipes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            nome TEXT NOT NULL,
            department_id UUID REFERENCES public.departments(id),
            supervisor_id UUID REFERENCES auth.users(id),
            manager_id UUID REFERENCES auth.users(id),
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    ELSE
        ALTER TABLE public.equipes ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
        ALTER TABLE public.equipes ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES auth.users(id);
        ALTER TABLE public.equipes ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Auditoria (Log de ações)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    user_role TEXT,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', etc
    entity_type TEXT NOT NULL, -- 'profiles', 'ordens_servico', 'execution_codes'
    entity_id UUID,
    previous_value JSONB,
    new_value JSONB,
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configurações Globais
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir alguns departamentos padrão
INSERT INTO public.departments (name, description) VALUES 
('Administração', 'Gestão administrativa central'),
('Operação', 'Execução de serviços em campo'),
('Financeiro', 'Medição e faturamento'),
('Comercial', 'Relacionamento com cliente')
ON CONFLICT (name) DO NOTHING;

-- Inserir configurações padrão
INSERT INTO public.system_settings (key, value, description) VALUES 
('require_gps_finish', 'true', 'Exigir GPS para finalizar ordem de serviço'),
('require_photo_before', 'true', 'Exigir foto antes da execução'),
('require_photo_after', 'true', 'Exigir foto após a execução'),
('allowed_gallery_upload', 'false', 'Permitir upload da galeria (se false, apenas câmera)')
ON CONFLICT (key) DO NOTHING;

-- Ativar RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas Administrativas (Acesso Total para Admin)
CREATE POLICY "Admin full access to departments" ON public.departments FOR ALL TO authenticated 
USING ((SELECT cargo FROM public.profiles WHERE id = auth.uid()) = 'Administrador');

CREATE POLICY "Admin full access to audit_logs" ON public.audit_logs FOR SELECT TO authenticated 
USING ((SELECT cargo FROM public.profiles WHERE id = auth.uid()) = 'Administrador');

CREATE POLICY "Admin full access to system_settings" ON public.system_settings FOR ALL TO authenticated 
USING ((SELECT cargo FROM public.profiles WHERE id = auth.uid()) = 'Administrador');

-- Visualização básica para outros cargos
CREATE POLICY "Public departments view" ON public.departments FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Public settings view" ON public.system_settings FOR SELECT TO authenticated USING (true);

-- Função para registrar auditoria automaticamente (Exemplo para OS)
CREATE OR REPLACE FUNCTION public.fn_audit_log_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        user_role,
        action,
        entity_type,
        entity_id,
        previous_value,
        new_value,
        description
    ) VALUES (
        auth.uid(),
        (SELECT cargo FROM public.profiles WHERE id = auth.uid()),
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        'Ação automatizada via trigger'
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativar auditoria em tabelas críticas
CREATE TRIGGER trg_audit_os AFTER INSERT OR UPDATE OR DELETE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_change();
CREATE TRIGGER trg_audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_change();
