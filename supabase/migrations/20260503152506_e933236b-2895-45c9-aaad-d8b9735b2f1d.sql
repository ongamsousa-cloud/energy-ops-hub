
-- Default ativo = false para novos cadastros
ALTER TABLE public.profiles ALTER COLUMN ativo SET DEFAULT false;

-- Atualizar handle_new_user para criar perfil pendente, sem role automática
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, ativo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email, false);
  RETURN NEW;
END $$;

-- handle_new_user_role: não atribuir mais role automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Aprovação manual pelo admin define a role.
  RETURN NEW;
END;
$$;

-- Garantir RLS para admins gerenciarem profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins manage all profiles'
  ) THEN
    CREATE POLICY "Admins manage all profiles" ON public.profiles
      FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;
