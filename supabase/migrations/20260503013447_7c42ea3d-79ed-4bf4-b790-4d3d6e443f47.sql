CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
    target_role public.app_role;
BEGIN
    -- Busca o papel do metadado 'role'
    target_role := (new.raw_user_meta_data->>'role')::public.app_role;
    
    -- Insere o papel na tabela user_roles
    IF target_role IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, target_role);
    END IF;
    
    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Se houver erro (ex: papel inválido), ignora e permite a criação do usuário
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função após o insert no auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
