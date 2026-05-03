-- Create API integrations configuration table
CREATE TABLE IF NOT EXISTS public.api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    integration_type TEXT NOT NULL,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT false,
    environment TEXT DEFAULT 'sandbox',
    public_config JSONB DEFAULT '{}',
    secret_config_reference TEXT,
    last_success_at TIMESTAMP WITH TIME ZONE,
    last_error_at TIMESTAMP WITH TIME ZONE,
    last_error_message TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage integrations (using cargo)
CREATE POLICY "Admins can manage api_integrations" ON public.api_integrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.cargo = 'Administrador'
        )
    );

-- Create API request logs table
CREATE TABLE IF NOT EXISTS public.api_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    integration_type TEXT NOT NULL,
    endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    success BOOLEAN,
    error_message TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and auditors can view request logs
CREATE POLICY "Admins and auditors can view api_request_logs" ON public.api_request_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.cargo = 'Administrador' OR profiles.cargo = 'Auditor')
        )
    );

-- Create Geocoding cache table
CREATE TABLE IF NOT EXISTS public.geocoding_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL UNIQUE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    formatted_address TEXT,
    provider TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.geocoding_cache ENABLE ROW LEVEL SECURITY;

-- Everyone can read geocoding cache
CREATE POLICY "Everyone can read geocoding_cache" ON public.geocoding_cache
    FOR SELECT USING (true);

-- Create User push tokens table
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT,
    browser TEXT,
    device_info JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users can manage their own push tokens" ON public.user_push_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Create Email logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    recipient TEXT NOT NULL,
    subject TEXT,
    template TEXT,
    status TEXT DEFAULT 'pending',
    provider TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and auditors can view email logs
CREATE POLICY "Admins and auditors can view email_logs" ON public.email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.cargo = 'Administrador' OR profiles.cargo = 'Auditor')
        )
    );

-- Create WhatsApp logs table
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID,
    user_id UUID REFERENCES auth.users(id),
    recipient_phone TEXT NOT NULL,
    template_name TEXT,
    message_type TEXT,
    status TEXT DEFAULT 'pending',
    provider_response JSONB DEFAULT '{}',
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and auditors can view whatsapp logs
CREATE POLICY "Admins and auditors can view whatsapp_logs" ON public.whatsapp_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.cargo = 'Administrador' OR profiles.cargo = 'Auditor')
        )
    );

-- Create Payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    service_order_id UUID,
    plan_id TEXT,
    provider TEXT,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    amount DECIMAL(10,2),
    qr_code TEXT,
    qr_code_base64 TEXT,
    payment_link TEXT,
    external_payment_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments, finance and admin can see all
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.cargo = 'Administrador' OR profiles.cargo = 'Financeiro')
        )
    );

-- Create Payment webhook logs table
CREATE TABLE IF NOT EXISTS public.payment_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_type TEXT,
    external_id TEXT,
    payload JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook logs
CREATE POLICY "Admins can view payment_webhook_logs" ON public.payment_webhook_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.cargo = 'Administrador'
        )
    );

-- Create Report exports table
CREATE TABLE IF NOT EXISTS public.report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type TEXT NOT NULL,
    requested_by UUID REFERENCES auth.users(id),
    filters JSONB DEFAULT '{}',
    file_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

-- Users can view their own report exports
CREATE POLICY "Users can view their own report exports" ON public.report_exports
    FOR SELECT USING (auth.uid() = requested_by);

-- Create AI analysis logs table
CREATE TABLE IF NOT EXISTS public.ai_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID,
    requested_by UUID REFERENCES auth.users(id),
    provider TEXT,
    analysis_type TEXT,
    input_snapshot JSONB DEFAULT '{}',
    output_result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI logs, admins and managers can see all
CREATE POLICY "View AI logs policy" ON public.ai_analysis_logs
    FOR SELECT USING (
        auth.uid() = requested_by OR 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.cargo = 'Administrador' OR profiles.cargo = 'Gestor')
        )
    );

-- Insert default configurations
INSERT INTO public.api_integrations (provider, integration_type, name, active)
VALUES 
    ('viacep', 'cep', 'ViaCEP (Primário)', true),
    ('brasilapi', 'cep', 'BrasilAPI (Fallback)', true),
    ('openstreetmap', 'map', 'OpenStreetMap', true),
    ('nominatim', 'geocoding', 'Nominatim Geocoding', true);
