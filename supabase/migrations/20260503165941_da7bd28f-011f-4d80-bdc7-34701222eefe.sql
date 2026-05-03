-- Ajustar política de leitura de Ordens de Serviço para ser restritiva
DROP POLICY IF EXISTS "os read public" ON public.ordens_servico;
CREATE POLICY "OS: Read Access" ON public.ordens_servico
  FOR SELECT USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'financeiro'::app_role, 'auditor'::app_role]) OR
    (profissional_id = auth.uid()) OR
    (assigned_supervisor_id = auth.uid())
  );

-- Garantir que a tabela de histórico de auditoria seja visível para quem importa
ALTER TABLE public.os_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Audit logs read" ON public.os_audit_logs;
CREATE POLICY "Audit logs read" ON public.os_audit_logs
  FOR SELECT USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'auditor'::app_role]) OR
    (user_id = auth.uid())
  );

-- Proteção de dados financeiros
ALTER TABLE public.financial_order_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Financial read" ON public.financial_order_records;
CREATE POLICY "Financial read" ON public.financial_order_records
  FOR SELECT USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'financeiro'::app_role])
  );
