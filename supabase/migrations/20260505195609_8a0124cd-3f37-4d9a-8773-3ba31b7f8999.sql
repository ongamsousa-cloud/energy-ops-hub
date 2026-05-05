-- Tabela para Logs de Auditoria Técnica
CREATE TABLE IF NOT EXISTS public.developer_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para Logs de Erro do Sistema
CREATE TABLE IF NOT EXISTS public.system_error_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    module TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para Backup de Configurações
CREATE TABLE IF NOT EXISTS public.system_backups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    config_type TEXT NOT NULL, -- 'design_system', 'app_settings', 'maintenance'
    data JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.developer_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas desenvolvedores podem ler/inserir logs
CREATE POLICY "Developers can manage audit logs"
ON public.developer_audit_logs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'developer'
    )
);

CREATE POLICY "Developers can manage error logs"
ON public.system_error_logs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'developer'
    )
);

CREATE POLICY "Developers can manage backups"
ON public.system_backups
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'developer'
    )
);

-- Adicionar campo 2FA no perfil (opcional se não usar Supabase MFA nativo)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;

-- Função para registrar auditoria via RPC (opcional, mas bom para frontend)
CREATE OR REPLACE FUNCTION public.log_developer_action(
    p_action TEXT,
    p_module TEXT,
    p_details JSONB,
    p_ip TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.developer_audit_logs (user_id, action, module, details, ip_address)
    VALUES (auth.uid(), p_action, p_module, p_details, p_ip);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
