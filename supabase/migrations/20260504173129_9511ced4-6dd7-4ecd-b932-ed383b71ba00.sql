-- Atualizar a função check_os_access para ser mais abrangente
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
    
    -- 1. Admin Master e Gestores do sistema (via roles)
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')) THEN
        RETURN TRUE;
    END IF;

    -- 2. Cargos Administrativos (via profiles.cargo)
    IF user_cargo IN ('Administrador', 'Gestor', 'Financeiro', 'Auditor') THEN
        RETURN TRUE;
    END IF;
    
    -- 3. Criador da OS (Sempre tem acesso)
    IF os_row.created_by = auth.uid() THEN
        RETURN TRUE;
    END IF;

    -- 4. Pertence ao departamento responsável
    IF os_row.department_id = user_dep THEN
        RETURN TRUE;
    END IF;
    
    -- 5. Profissional designado
    IF os_row.profissional_id = auth.uid() THEN
        RETURN TRUE;
    END IF;
    
    -- 6. Gestor ou Supervisor designado
    IF os_row.gestor_responsavel_id = auth.uid() OR os_row.assigned_supervisor_id = auth.uid() OR os_row.assigned_manager_id = auth.uid() THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$function$;

-- Limpar e simplificar políticas de SELECT em ordens_servico
DROP POLICY IF EXISTS "OS: Read Access" ON public.ordens_servico;
DROP POLICY IF EXISTS "Supervisor: Team orders" ON public.ordens_servico;
DROP POLICY IF EXISTS "Technician: Own orders only" ON public.ordens_servico;
DROP POLICY IF EXISTS "OS granular access" ON public.ordens_servico;

CREATE POLICY "OS: Visibility Policy" 
ON public.ordens_servico 
FOR SELECT 
USING (check_os_access(ordens_servico.*));
