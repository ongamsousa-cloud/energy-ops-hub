
-- Trigger function: ao criar uma OS, notificar departamentos e abrir registros downstream
CREATE OR REPLACE FUNCTION public.fn_os_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  obra_nome text;
BEGIN
  SELECT nome INTO obra_nome FROM public.obras WHERE id = NEW.obra_id;

  -- 1. Notificar admins, gestores, supervisores, almoxarifes e financeiro
  INSERT INTO public.notificacoes (user_id, titulo, mensagem, link)
  SELECT ur.user_id,
         'Nova OS ' || NEW.numero,
         COALESCE('Obra: ' || obra_nome, 'Nova ordem de serviço criada.'),
         '/app/os/' || NEW.id::text
  FROM public.user_roles ur
  WHERE ur.role IN ('admin','gestor','supervisor','financeiro','estoque')
  ON CONFLICT DO NOTHING;

  -- 2. Se tiver equipe, atribuir supervisor automaticamente
  IF NEW.equipe_id IS NOT NULL AND NEW.assigned_supervisor_id IS NULL THEN
    UPDATE public.ordens_servico
    SET assigned_supervisor_id = (SELECT supervisor_id FROM public.equipes WHERE id = NEW.equipe_id)
    WHERE id = NEW.id;
  END IF;

  -- 3. Criar registro financeiro inicial
  INSERT INTO public.financial_order_records (service_order_id, financial_status, estimated_cost)
  VALUES (NEW.id, 'aguardando_analise', COALESCE(NEW.total_umd, 0) * 10)
  ON CONFLICT (service_order_id) DO NOTHING;

  -- 4. Registrar histórico
  BEGIN
    INSERT INTO public.service_order_history (service_order_id, user_id, action, new_status, description)
    VALUES (NEW.id, COALESCE(NEW.created_by, NEW.profissional_id), 'CREATE', NEW.status::text, 'OS criada');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_os_after_insert ON public.ordens_servico;
CREATE TRIGGER trg_os_after_insert
AFTER INSERT ON public.ordens_servico
FOR EACH ROW EXECUTE FUNCTION public.fn_os_after_insert();

-- Garantir unique no financial_order_records.service_order_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_order_records_service_order_id_key'
  ) THEN
    ALTER TABLE public.financial_order_records
      ADD CONSTRAINT financial_order_records_service_order_id_key UNIQUE (service_order_id);
  END IF;
END $$;

-- Habilitar realtime
ALTER TABLE public.ordens_servico REPLICA IDENTITY FULL;
ALTER TABLE public.notificacoes REPLICA IDENTITY FULL;
ALTER TABLE public.material_reservations REPLICA IDENTITY FULL;

DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='ordens_servico';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ordens_servico';
  END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='notificacoes';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes';
  END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='material_reservations';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.material_reservations';
  END IF;
END $$;
