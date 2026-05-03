-- Permitir que qualquer um (inclusive anon) possa buscar profiles pelo email
-- Isso é necessário para que o mockSignIn funcione antes do usuário estar logado no Supabase
CREATE POLICY "profiles select public for mock login" ON public.profiles 
FOR SELECT USING (true);

-- Remover a política antiga para evitar conflitos (opcional, mas limpo)
DROP POLICY IF EXISTS "profiles select self/admin" ON public.profiles;