-- 1. Criar tabela de empresas se não existir
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document_cnpj TEXT UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de empresas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. Garantir company_id em tabelas principais
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.equipes ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- 3. Adicionar campos ausentes na tabela employees
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS matricula TEXT,
ADD COLUMN IF NOT EXISTS unidade_filial TEXT,
ADD COLUMN IF NOT EXISTS tipo_vinculo TEXT DEFAULT 'CLT',
ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.employees(id),
ADD COLUMN IF NOT EXISTS regiao_atuacao TEXT,
ADD COLUMN IF NOT EXISTS veiculo_vinculado TEXT,
ADD COLUMN IF NOT EXISTS horario_trabalho TEXT,
ADD COLUMN IF NOT EXISTS servicos_habilitados TEXT[];

-- 4. Criar função para verificar se o usuário pertence à empresa
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Atualizar políticas de RLS para Multi-tenancy
-- Empresas
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
    CREATE POLICY "Users can view their own company" ON public.companies 
    FOR SELECT USING (id = public.get_user_company_id());
END $$;

-- Funcionários
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view employees in their company" ON public.employees;
    CREATE POLICY "Users can view employees in their company" ON public.employees 
    FOR SELECT USING (company_id = public.get_user_company_id() OR company_id IS NULL);
    
    DROP POLICY IF EXISTS "Managers can manage employees" ON public.employees;
    CREATE POLICY "Managers can manage employees" ON public.employees 
    FOR ALL USING (company_id = public.get_user_company_id())
    WITH CHECK (company_id = public.get_user_company_id());
END $$;

-- 6. Garantir tabela de auditoria
CREATE TABLE IF NOT EXISTS public.employee_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id),
  company_id UUID REFERENCES public.companies(id),
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.employee_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view audit logs of their company" ON public.employee_audit_logs
FOR SELECT USING (company_id = public.get_user_company_id());

-- 7. Trigger para atualizar updated_at em companies
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_companies_updated_at ON public.companies;
CREATE TRIGGER tr_update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
