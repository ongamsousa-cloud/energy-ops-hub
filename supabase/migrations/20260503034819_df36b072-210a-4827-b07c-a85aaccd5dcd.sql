-- Tabelas para o Módulo de Auditoria

-- Casos de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    audit_type TEXT DEFAULT 'operacional', -- 'operacional', 'financeira', 'tecnica', 'conformidade'
    auditor_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT DEFAULT 'pendente', -- 'pendente', 'em_auditoria', 'aprovada', 'reprovada', 'com_ressalva', 'em_investigacao'
    risk_level TEXT DEFAULT 'baixo', -- 'baixo', 'medio', 'alto', 'critico'
    summary TEXT,
    findings_count INTEGER DEFAULT 0,
    recommendation TEXT,
    final_decision TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(service_order_id, auditor_id)
);

-- Itens de Checklist da Auditoria
CREATE TABLE IF NOT EXISTS public.audit_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id UUID NOT NULL REFERENCES public.audit_cases(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL,
    item_label TEXT NOT NULL,
    status TEXT DEFAULT 'nao_conforme', -- 'conforme', 'nao_conforme', 'nao_se_aplica', 'revisar'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inconsistências Detectadas (Findings)
CREATE TABLE IF NOT EXISTS public.audit_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id UUID NOT NULL REFERENCES public.audit_cases(id) ON DELETE CASCADE,
    service_order_id UUID NOT NULL REFERENCES public.ordens_servico(id),
    finding_type TEXT NOT NULL, -- 'missing_gps', 'invalid_photo', 'cost_divergence', 'rule_violation'
    severity TEXT DEFAULT 'media',
    title TEXT NOT NULL,
    description TEXT,
    related_user_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'aberto', -- 'aberto', 'em_correcao', 'resolvido', 'ignorado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Solicitações de Esclarecimento
CREATE TABLE IF NOT EXISTS public.audit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id UUID REFERENCES public.audit_cases(id) ON DELETE CASCADE,
    service_order_id UUID REFERENCES public.ordens_servico(id),
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    requested_to UUID NOT NULL REFERENCES auth.users(id),
    message TEXT NOT NULL,
    response TEXT,
    status TEXT DEFAULT 'aguardando', -- 'aguardando', 'respondido', 'expirado'
    due_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Revisão de Mídias/Evidências
CREATE TABLE IF NOT EXISTS public.audit_evidence_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_case_id UUID NOT NULL REFERENCES public.audit_cases(id) ON DELETE CASCADE,
    service_order_media_id UUID NOT NULL, -- Referência lógica para service_order_media
    status TEXT DEFAULT 'inconsistente',
    notes TEXT,
    reviewed_by UUID NOT NULL REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.audit_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_evidence_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas de Auditoria
CREATE POLICY "Auditors can manage their cases" 
ON public.audit_cases 
FOR ALL 
TO authenticated 
USING ((SELECT cargo FROM public.profiles WHERE id = auth.uid()) IN ('Administrador', 'Auditor'));

CREATE POLICY "Auditors can manage checklist items" 
ON public.audit_checklist_items 
FOR ALL 
TO authenticated 
USING (EXISTS (
    SELECT 1 FROM public.audit_cases ac 
    WHERE ac.id = audit_case_id AND (ac.auditor_id = auth.uid() OR (SELECT cargo FROM public.profiles WHERE id = auth.uid()) = 'Administrador')
));

CREATE POLICY "Auditors can manage findings" 
ON public.audit_findings 
FOR ALL 
TO authenticated 
USING ((SELECT cargo FROM public.profiles WHERE id = auth.uid()) IN ('Administrador', 'Auditor'));

CREATE POLICY "Users can view and respond to their audit requests" 
ON public.audit_requests 
FOR ALL 
TO authenticated 
USING (requested_by = auth.uid() OR requested_to = auth.uid() OR (SELECT cargo FROM public.profiles WHERE id = auth.uid()) = 'Administrador');

-- Triggers para Auditoria
CREATE TRIGGER update_audit_cases_at BEFORE UPDATE ON public.audit_cases FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_audit_findings_at BEFORE UPDATE ON public.audit_findings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_audit_requests_at BEFORE UPDATE ON public.audit_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
