-- 1. Tabelas de Configurações
CREATE TABLE IF NOT EXISTS public.developer_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.design_system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_color TEXT DEFAULT '0 72% 51%',
    secondary_color TEXT DEFAULT '60 5% 96%',
    accent_color TEXT DEFAULT '60 5% 94%',
    background_color TEXT DEFAULT '60 9% 98%',
    surface_color TEXT DEFAULT '0 0% 100%',
    text_color TEXT DEFAULT '0 0% 4%',
    muted_text_color TEXT DEFAULT '25 5% 35%',
    border_color TEXT DEFAULT '24 6% 90%',
    success_color TEXT DEFAULT '142 71% 30%',
    warning_color TEXT DEFAULT '38 84% 35%',
    danger_color TEXT DEFAULT '0 72% 42%',
    info_color TEXT DEFAULT '224 76% 48%',
    font_heading TEXT DEFAULT 'Inter',
    font_body TEXT DEFAULT 'Inter',
    font_buttons TEXT DEFAULT 'Inter',
    button_radius TEXT DEFAULT '0.5rem',
    card_radius TEXT DEFAULT '0.5rem',
    input_radius TEXT DEFAULT '0.5rem',
    sidebar_style TEXT DEFAULT 'modern',
    theme_mode TEXT DEFAULT 'system',
    logo_url TEXT,
    favicon_url TEXT,
    login_background_url TEXT,
    app_icon_url TEXT,
    custom_css TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.design_system_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    settings_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.developer_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_category TEXT NOT NULL,
    storage_bucket TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.developer_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_message TEXT NOT NULL,
    error_stack TEXT,
    source TEXT,
    route TEXT,
    user_id UUID REFERENCES auth.users(id),
    severity TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID NOT NULL REFERENCES auth.users(id),
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    temporary_password_created BOOLEAN DEFAULT false,
    force_password_change BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    used_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.system_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_maintenance_mode BOOLEAN DEFAULT false,
    message TEXT,
    allowed_roles TEXT[],
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Habilita RLS
ALTER TABLE public.developer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_system_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_maintenance ENABLE ROW LEVEL SECURITY;

-- 3. Função is_developer
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('developer', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Políticas
CREATE POLICY "Dev access only developer_settings" ON public.developer_settings FOR ALL USING (public.is_developer());
CREATE POLICY "Dev access only design_system_settings" ON public.design_system_settings FOR ALL USING (public.is_developer());
CREATE POLICY "Dev access only design_system_presets" ON public.design_system_presets FOR ALL USING (public.is_developer());
CREATE POLICY "Dev access only developer_files" ON public.developer_files FOR ALL USING (public.is_developer());
CREATE POLICY "Dev access only developer_audit_logs" ON public.developer_audit_logs FOR ALL USING (public.is_developer());
CREATE POLICY "Dev access only system_error_logs" ON public.system_error_logs FOR ALL USING (public.is_developer());
CREATE POLICY "Dev access only password_reset_requests" ON public.password_reset_requests FOR ALL USING (public.is_developer());
CREATE POLICY "Select access maintenance" ON public.system_maintenance FOR SELECT USING (true);
CREATE POLICY "All access maintenance dev" ON public.system_maintenance FOR ALL USING (public.is_developer());

-- 5. Triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_developer_settings_updated_at ON public.developer_settings;
CREATE TRIGGER tr_developer_settings_updated_at BEFORE UPDATE ON public.developer_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_design_system_settings_updated_at ON public.design_system_settings;
CREATE TRIGGER tr_design_system_settings_updated_at BEFORE UPDATE ON public.design_system_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_system_maintenance_updated_at ON public.system_maintenance;
CREATE TRIGGER tr_system_maintenance_updated_at BEFORE UPDATE ON public.system_maintenance FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
