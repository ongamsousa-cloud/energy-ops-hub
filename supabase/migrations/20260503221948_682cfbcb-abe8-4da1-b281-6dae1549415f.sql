
-- ============================================================
-- A1: Triggers de comunicação entre departamentos
-- ============================================================

-- 1) Roteamento por status: aprovada / aguardando_revisao / reprovada / correcao_solicitada
CREATE OR REPLACE FUNCTION public.fn_os_status_route_full()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  obra_nome text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;

  SELECT nome INTO obra_nome FROM public.obras WHERE id = NEW.obra_id;

  -- correção / reprovação -> notifica profissional de campo
  IF NEW.status::text IN ('reprovada','correcao_solicitada') AND NEW.profissional_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, link)
    VALUES (NEW.profissional_id,
            'OS ' || NEW.numero || ' precisa de correção',
            COALESCE(NEW.motivo_reprovacao, 'Sua OS foi devolvida para correção.'),
            '/app/os/' || NEW.id::text);
  END IF;

  -- aguardando_revisao -> notifica supervisor atribuído
  IF NEW.status::text IN ('aguardando_revisao','em_revisao') AND NEW.assigned_supervisor_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, link)
    VALUES (NEW.assigned_supervisor_id,
            'OS ' || NEW.numero || ' aguardando sua revisão',
            COALESCE('Obra: ' || obra_nome, 'Há uma OS aguardando análise.'),
            '/app/os/' || NEW.id::text);
  END IF;

  -- aprovada -> notifica financeiro + auditor + popula financial_order_records
  IF NEW.status::text = 'aprovada' AND OLD.status::text <> 'aprovada' THEN
    INSERT INTO public.financial_order_records (service_order_id, financial_status, estimated_cost, real_cost, approved_value)
    VALUES (NEW.id, 'aguardando_analise',
            COALESCE(NEW.total_umd,0) * 10,
            COALESCE(NEW.total_umd_aprovada,0) * 10,
            COALESCE(NEW.total_umd_aprovada,0) * 10)
    ON CONFLICT (service_order_id) DO UPDATE
      SET real_cost = EXCLUDED.real_cost,
          approved_value = EXCLUDED.approved_value,
          financial_status = 'aguardando_analise',
          updated_at = now();

    INSERT INTO public.notificacoes (user_id, titulo, mensagem, link)
    SELECT ur.user_id,
           'OS ' || NEW.numero || ' aprovada',
           COALESCE('Obra: ' || obra_nome || ' — pronta para análise.', 'OS aprovada e pronta para análise.'),
           '/app/os/' || NEW.id::text
    FROM public.user_roles ur
    WHERE ur.role IN ('financeiro','auditor');
  END IF;

  -- log no histórico
  BEGIN
    INSERT INTO public.service_order_history (service_order_id, user_id, action, new_status, description)
    VALUES (NEW.id, COALESCE(auth.uid(), NEW.profissional_id, NEW.created_by),
            'STATUS_CHANGE', NEW.status::text,
            'Status alterado de ' || COALESCE(OLD.status::text,'(novo)') || ' para ' || NEW.status::text);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_os_status_route ON public.ordens_servico;
CREATE TRIGGER trg_os_status_route
AFTER UPDATE OF status ON public.ordens_servico
FOR EACH ROW EXECUTE FUNCTION public.fn_os_status_route_full();

-- 2) Alerta de estoque -> notifica estoque + gestor + admin
CREATE OR REPLACE FUNCTION public.fn_stock_alert_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notificacoes (user_id, titulo, mensagem, link)
  SELECT ur.user_id,
         'Alerta de estoque',
         COALESCE(NEW.message, 'Novo alerta operacional de estoque.'),
         '/app/estoque'
  FROM public.user_roles ur
  WHERE ur.role IN ('admin','gestor','estoque');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_stock_alert_notify ON public.stock_alerts;
CREATE TRIGGER trg_stock_alert_notify
AFTER INSERT ON public.stock_alerts
FOR EACH ROW EXECUTE FUNCTION public.fn_stock_alert_notify();

-- 3) Mensagens internas da OS -> notifica supervisor/profissional
CREATE OR REPLACE FUNCTION public.fn_os_message_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  os_rec RECORD;
BEGIN
  SELECT numero, profissional_id, assigned_supervisor_id
    INTO os_rec FROM public.ordens_servico WHERE id = NEW.os_id;
  IF os_rec IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notificacoes (user_id, titulo, mensagem, link)
  SELECT uid,
         'Nova mensagem na OS ' || os_rec.numero,
         LEFT(COALESCE(NEW.conteudo,'[mensagem]'), 120),
         '/app/os/' || NEW.os_id::text
  FROM (VALUES (os_rec.profissional_id), (os_rec.assigned_supervisor_id)) AS t(uid)
  WHERE uid IS NOT NULL AND uid <> NEW.sender_id;

  RETURN NEW;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='os_messages') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_os_message_notify ON public.os_messages';
    EXECUTE 'CREATE TRIGGER trg_os_message_notify AFTER INSERT ON public.os_messages FOR EACH ROW EXECUTE FUNCTION public.fn_os_message_notify()';
  END IF;
END $$;
