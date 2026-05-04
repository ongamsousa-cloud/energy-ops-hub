-- A função get_users_without_roles não existe no banco, vamos criá-la para o Dashboard
CREATE OR REPLACE FUNCTION get_users_without_roles()
RETURNS TABLE (id UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id 
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.id IS NULL;
END;
$$;

-- Garantir que o enum de roles inclua o developer se existir, senão ignorar erro
DO $$
BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'developer';
EXCEPTION
    WHEN others THEN NULL;
END $$;
