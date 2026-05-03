-- Tabelas Financeiras

-- Registros Financeiros das Ordens de Serviço
CREATE TABLE IF NOT EXISTS public.financial_order_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    financial_status TEXT DEFAULT 'aguardando_analise', -- 'aguardando_analise', 'em_analise', 'aprovado', 'reprovado', 'com_divergencia', 'faturado'
    is_billable BOOLEAN DEFAULT true,
    estimated_cost NUMERIC(12,2) DEFAULT 0,
    real_cost NUMERIC(12,2) DEFAULT 0,
    approved_value NUMERIC(12,2) DEFAULT 0,
    adjusted_value NUMERIC(12,2) DEFAULT 0,
    adjustment_reason TEXT,
    analyzed_by UUID REFERENCES auth.users(id),
    analyzed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(service_order_id)
);

-- Registros Financeiros de Materiais
CREATE TABLE IF NOT EXISTS public.financial_material_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    execution_record_id UUID REFERENCES public.service_execution_records(id),
    material_name TEXT NOT NULL,
    material_code TEXT,
    quantity NUMERIC(10,2) NOT NULL,
    unit TEXT,
    unit_cost NUMERIC(12,2) DEFAULT 0,
    total_cost NUMERIC(12,2) DEFAULT 0,
    is_extra BOOLEAN DEFAULT false,
    expected_quantity NUMERIC(10,2),
    technician_id UUID REFERENCES auth.users(id),
    supervisor_id UUID REFERENCES auth.users(id),
    financial_status TEXT DEFAULT 'pendente',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Regras Financeiras
CREATE TABLE IF NOT EXISTS public.financial_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    rule_config JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Histórico Financeiro
CREATE TABLE IF NOT EXISTS public.financial_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    financial_record_id UUID REFERENCES public.financial_order_records(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    previous_value NUMERIC(12,2),
    new_value NUMERIC(12,2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cache de Relatórios Financeiros
CREATE TABLE IF NOT EXISTS public.financial_reports_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type TEXT NOT NULL,
    period_start DATE,
    period_end DATE,
    filters JSONB,
    data_snapshot JSONB,
    generated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar colunas na ordens_servico para acesso rápido
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS valor_previsto NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_aprovado NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status_financeiro TEXT DEFAULT 'sem_impacto';

-- Ativar RLS
ALTER TABLE public.financial_order_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_material_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports_cache ENABLE ROW LEVEL SECURITY;

-- Políticas Financeiras
CREATE POLICY "Finance staff can manage financial records" 
ON public.financial_order_records 
FOR ALL 
TO authenticated 
USING ((SELECT cargo FROM public.profiles WHERE id = auth.uid()) IN ('Administrador', 'Gestor', 'Financeiro / Medição'));

CREATE POLICY "Finance staff can manage material records" 
ON public.financial_material_records 
FOR ALL 
TO authenticated 
USING ((SELECT cargo FROM public.profiles WHERE id = auth.uid()) IN ('Administrador', 'Gestor', 'Financeiro / Medição'));

CREATE POLICY "Finance staff can view history" 
ON public.financial_history 
FOR SELECT 
TO authenticated 
USING (true);

-- Triggers para atualização automática
CREATE TRIGGER update_financial_order_records_at BEFORE UPDATE ON public.financial_order_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_financial_material_records_at BEFORE UPDATE ON public.financial_material_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_financial_rules_at BEFORE UPDATE ON public.financial_rules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Criar gatilho para criar registro financeiro quando OS for aprovada operacionalmente
CREATE OR REPLACE FUNCTION public.fn_create_financial_record()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'aprovada' AND OLD.status != 'aprovada') THEN
        INSERT INTO public.financial_order_records (service_order_id, estimated_cost, real_cost, approved_value)
        VALUES (NEW.id, NEW.total_umd * 10, NEW.total_umd_aprovada * 10, NEW.total_umd_aprovada * 10)
        ON CONFLICT (service_order_id) DO UPDATE 
        SET real_cost = EXCLUDED.real_cost, approved_value = EXCLUDED.approved_value;
        
        UPDATE public.ordens_servico SET status_financeiro = 'aguardando_analise' WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_os_to_finance AFTER UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.fn_create_financial_record();
