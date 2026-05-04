-- Add acronym column to departments
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS acronym TEXT;

-- Update existing departments with acronyms
UPDATE public.departments SET acronym = 'ADM' WHERE name = 'Administração';
UPDATE public.departments SET acronym = 'OPER' WHERE name = 'Operação' OR name = 'Operações';
UPDATE public.departments SET acronym = 'FIN' WHERE name = 'Financeiro';
UPDATE public.departments SET acronym = 'COM' WHERE name = 'Comercial';
UPDATE public.departments SET acronym = 'AUD' WHERE name = 'Auditoria';
UPDATE public.departments SET acronym = 'EST' WHERE name = 'Almoxarifado / Estoque' OR name = 'Estoque / Almoxarifado';
UPDATE public.departments SET acronym = 'CAM' WHERE name = 'Campo';
UPDATE public.departments SET acronym = 'MED' WHERE name = 'Medição';
UPDATE public.departments SET acronym = 'APROV' WHERE name = 'Aprovações';
UPDATE public.departments SET acronym = 'REL' WHERE name = 'Relatórios';
UPDATE public.departments SET acronym = 'SEG' WHERE name = 'Segurança / Qualidade';
UPDATE public.departments SET acronym = 'SAC' WHERE name = 'Atendimento / Cliente';

-- Update acronyms for any others if they don't have one
UPDATE public.departments SET acronym = UPPER(LEFT(name, 3)) WHERE acronym IS NULL;

-- Improve check_os_access function for better visibility
CREATE OR REPLACE FUNCTION public.check_os_access(os_row ordens_servico)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_role_val TEXT;
    user_dep UUID;
    user_cargo TEXT;
BEGIN
    -- Obter departamento e cargo do usuário atual
    SELECT department_id, cargo INTO user_dep, user_cargo FROM public.profiles WHERE id = auth.uid();
    
    -- 1. Admin Master e Gestores do sistema (via roles) - Acesso Total
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')) THEN
        RETURN TRUE;
    END IF;

    -- 2. Cargos Administrativos - Acesso Total
    IF user_cargo IN ('Administrador', 'Gestor', 'Financeiro', 'Auditor') THEN
        RETURN TRUE;
    END IF;
    
    -- 3. Criador da OS (Sempre tem acesso)
    IF os_row.created_by = auth.uid() THEN
        RETURN TRUE;
    END IF;

    -- 4. Pertence ao departamento responsável
    -- IMPORTANTE: Se a OS foi enviada para o departamento do usuário, ele deve ver.
    IF os_row.department_id = user_dep THEN
        RETURN TRUE;
    END IF;
    
    -- 5. Profissional designado (Quem vai executar)
    IF os_row.profissional_id = auth.uid() THEN
        RETURN TRUE;
    END IF;
    
    -- 6. Gestor ou Supervisor designado especificamente
    IF os_row.gestor_responsavel_id = auth.uid() OR os_row.assigned_supervisor_id = auth.uid() OR os_row.assigned_manager_id = auth.uid() THEN
        RETURN TRUE;
    END IF;

    -- 7. Se o usuário for um supervisor, ele deve ver as OSs do seu departamento
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'supervisor') AND os_row.department_id = user_dep THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$function$;
