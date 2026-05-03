-- Padronização de Enums de Status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'os_operational_status') THEN
        CREATE TYPE os_operational_status AS ENUM (
            'pendente', 'atribuida', 'em_deslocamento', 'chegou_ao_local', 
            'em_execucao', 'execucao_pausada', 'nao_executada', 'aguardando_validacao', 
            'correcao_solicitada', 'reaberta', 'reprovada', 'aprovada', 
            'concluida', 'cancelada', 'critica', 'em_auditoria', 
            'aguardando_excecao', 'excecao_aprovada', 'excecao_negada'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'os_financial_status') THEN
        CREATE TYPE os_financial_status AS ENUM (
            'sem_impacto', 'aguardando_analise', 'em_analise', 'aprovada_financeiramente', 
            'reprovada_financeiramente', 'com_divergencia', 'aguardando_correcao_operacional', 
            'faturavel', 'nao_faturavel', 'aguardando_faturamento', 'faturada', 
            'cancelada_financeiramente', 'em_auditoria_financeira'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'os_audit_status') THEN
        CREATE TYPE os_audit_status AS ENUM (
            'nao_auditada', 'pendente_auditoria', 'em_auditoria', 'aprovada_na_auditoria', 
            'reprovada_na_auditoria', 'com_ressalva', 'com_inconsistencia', 
            'em_investigacao', 'aguardando_resposta', 'corrigida_apos_auditoria', 'encerrada'
        );
    END IF;
END $$;

-- Atualizar tabela ordens_servico para refletir a Fonte Única da Verdade
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS operational_status os_operational_status DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS financial_status os_financial_status DEFAULT 'sem_impacto',
ADD COLUMN IF NOT EXISTS audit_status os_audit_status DEFAULT 'nao_auditada',
ADD COLUMN IF NOT EXISTS assigned_manager_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS criticality_level TEXT DEFAULT 'normal';

-- Migrar status antigos para as novas colunas (Backwards compatibility logic)
UPDATE public.ordens_servico SET operational_status = status::text::os_operational_status WHERE operational_status IS NULL;

-- Atualizar Políticas RLS para Integração Total

-- 1. Técnico: Vê apenas suas ordens
DROP POLICY IF EXISTS "Profissionais veem suas OS" ON public.ordens_servico;
CREATE POLICY "Technician: Own orders only" 
ON public.ordens_servico 
FOR SELECT 
TO authenticated 
USING (profissional_id = auth.uid());

-- 2. Supervisor: Vê ordens da sua equipe ou onde ele é o supervisor designado
CREATE POLICY "Supervisor: Team orders" 
ON public.ordens_servico 
FOR SELECT 
TO authenticated 
USING (
    assigned_supervisor_id = auth.uid() OR 
    supervisor_id = auth.uid() OR
    (SELECT cargo FROM public.profiles WHERE id = auth.uid()) IN ('Administrador', 'Gestor', 'Supervisor')
);

-- 3. Gestor/Admin: Acesso Amplo conforme hierarquia
-- Administrador ignora filtros (resolvido por role check no cargo)

-- Garantir que Mídias sigam a mesma regra de visibilidade da OS
DROP POLICY IF EXISTS "Technicians can manage their own media" ON public.service_order_media;
CREATE POLICY "Integrated media access" 
ON public.service_order_media 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.ordens_servico os 
        WHERE os.id = service_order_id
    )
);

-- Histórico Único e Integrado
CREATE POLICY "Integrated history access" 
ON public.service_order_history 
FOR ALL 
TO authenticated 
USING (true);

-- Notificações Integradas
CREATE POLICY "Integrated notifications" 
ON public.notifications 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid());
