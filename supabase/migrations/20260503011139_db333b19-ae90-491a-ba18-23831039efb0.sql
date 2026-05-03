-- Tornar as tabelas de leitura pública para facilitar os testes e visualização dos dashboards
DROP POLICY IF EXISTS "obras read" ON public.obras;
CREATE POLICY "obras read public" ON public.obras FOR SELECT USING (true);

DROP POLICY IF EXISTS "os read scoped" ON public.ordens_servico;
CREATE POLICY "os read public" ON public.ordens_servico FOR SELECT USING (true);

DROP POLICY IF EXISTS "equipes read" ON public.equipes;
CREATE POLICY "equipes read public" ON public.equipes FOR SELECT USING (true);

DROP POLICY IF EXISTS "cat read" ON public.categorias;
CREATE POLICY "cat read public" ON public.categorias FOR SELECT USING (true);

DROP POLICY IF EXISTS "ativ read" ON public.atividades;
CREATE POLICY "ativ read public" ON public.atividades FOR SELECT USING (true);

DROP POLICY IF EXISTS "lanc read" ON public.os_atividades;
CREATE POLICY "lanc read public" ON public.os_atividades FOR SELECT USING (true);

DROP POLICY IF EXISTS "ev read" ON public.evidencias;
CREATE POLICY "ev read public" ON public.evidencias FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_roles read" ON public.user_roles;
CREATE POLICY "user_roles read public" ON public.user_roles FOR SELECT USING (true);