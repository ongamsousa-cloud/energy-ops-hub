-- Atualizar a função de trigger para tratar novos usuários corretamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, ativo, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)), 
    NEW.email, 
    false, -- Novos usuários começam inativos aguardando aprovação
    COALESCE(NEW.raw_user_meta_data->>'role', 'technician')
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    nome = COALESCE(EXCLUDED.nome, profiles.nome);
  RETURN NEW;
END;
$$;

-- Garantir que a configuração de auth permite senhas operacionais
-- (Isso é feito via ferramenta, mas deixo registrado no comentário da migração)
