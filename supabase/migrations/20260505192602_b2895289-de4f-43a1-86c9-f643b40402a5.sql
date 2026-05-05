-- Function to execute arbitrary SQL for developers
-- Security Note: This is EXTREMELY powerful. We restrict it to the developer role.
CREATE OR REPLACE FUNCTION public.execute_dev_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if user is developer
    IF NOT public.is_developer() THEN
        RAISE EXCEPTION 'Acesso negado. Apenas desenvolvedores podem executar comandos SQL diretos.';
    END IF;

    -- Log the execution
    INSERT INTO public.developer_audit_logs (user_id, action, module, new_value)
    VALUES (auth.uid(), 'EXECUTE_SQL', 'DATABASE', jsonb_build_object('query', sql_query));

    -- Execute query and return as JSON
    EXECUTE 'SELECT jsonb_agg(t) FROM (' || sql_query || ') t' INTO result;
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Insert initial modules for toggle
INSERT INTO public.developer_settings (setting_key, setting_value, setting_type, description, is_active)
VALUES 
('module_financeiro', '{"name": "Módulo Financeiro"}'::jsonb, 'module_toggle', 'Habilita/Desabilita funcionalidades financeiras', true),
('module_rh', '{"name": "Módulo RH"}'::jsonb, 'module_toggle', 'Habilita/Desabilita funcionalidades de RH', true),
('module_estoque', '{"name": "Módulo de Estoque"}'::jsonb, 'module_toggle', 'Habilita/Desabilita controle de estoque', true),
('module_pwa_push', '{"name": "Notificações Push PWA"}'::jsonb, 'module_toggle', 'Controle de notificações push via PWA', true)
ON CONFLICT (setting_key) DO NOTHING;
