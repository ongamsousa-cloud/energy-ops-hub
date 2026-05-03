
-- 1) app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings read auth"
  ON public.app_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "app_settings write admin"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER app_settings_updated
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (key, value)
VALUES ('theme.primary_color', '{"h":0,"s":72,"l":51}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2) Trigger de roteamento de correção em ordens_servico
CREATE OR REPLACE FUNCTION public.fn_os_status_route()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status::text IN ('reprovada','correcao_solicitada') THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, link)
    VALUES (
      NEW.profissional_id,
      'OS ' || NEW.numero || ' precisa de correção',
      COALESCE(NEW.motivo_reprovacao, 'Sua OS foi devolvida para correção.'),
      '/app/os/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_os_status_route ON public.ordens_servico;
CREATE TRIGGER trg_os_status_route
  AFTER UPDATE OF status ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.fn_os_status_route();

-- 3) Regras de evidência
INSERT INTO public.financial_rules (rule_key, name, description, rule_config, active)
VALUES (
  'evidence_rules',
  'Regras de Evidências',
  'Tipos, tamanhos e mínimos de evidências por OS',
  '{
    "allowed_image_types":["image/jpeg","image/png","image/webp"],
    "allowed_video_types":["video/mp4","video/quicktime"],
    "max_image_mb":10,
    "max_video_mb":100,
    "min_photos_after":2,
    "respect_activity_flags":true
  }'::jsonb,
  true
)
ON CONFLICT DO NOTHING;
