
-- Tabelas
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'direct',
  obra_id uuid NULL,
  titulo text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  ultima_leitura timestamptz NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  conteudo text NULL,
  anexo_url text NULL,
  anexo_tipo text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_cp_user ON public.conversation_participants(user_id);

-- Função de hierarquia
CREATE OR REPLACE FUNCTION public.can_message(_sender uuid, _receiver uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s_admin bool := has_any_role(_sender, ARRAY['admin','gestor']::app_role[]);
  r_admin bool := has_any_role(_receiver, ARRAY['admin','gestor']::app_role[]);
  s_sup bool := has_role(_sender, 'supervisor'::app_role);
  r_sup bool := has_role(_receiver, 'supervisor'::app_role);
  s_campo bool := has_role(_sender, 'campo'::app_role);
  r_campo bool := has_role(_receiver, 'campo'::app_role);
  s_fin bool := has_any_role(_sender, ARRAY['financeiro','auditor']::app_role[]);
  r_fin bool := has_any_role(_receiver, ARRAY['financeiro','auditor']::app_role[]);
BEGIN
  IF _sender = _receiver THEN RETURN false; END IF;
  -- admin/gestor falam com todos
  IF s_admin OR r_admin THEN RETURN true; END IF;
  -- financeiro/auditor: somente com admin/gestor (já coberto acima)
  IF s_fin OR r_fin THEN RETURN false; END IF;
  -- supervisor <-> técnico da sua equipe
  IF s_sup AND r_campo THEN
    RETURN EXISTS (
      SELECT 1 FROM public.equipes e
      JOIN public.equipe_membros em ON em.equipe_id = e.id
      WHERE e.supervisor_id = _sender AND em.profissional_id = _receiver
    );
  END IF;
  IF s_campo AND r_sup THEN
    RETURN EXISTS (
      SELECT 1 FROM public.equipes e
      JOIN public.equipe_membros em ON em.equipe_id = e.id
      WHERE e.supervisor_id = _receiver AND em.profissional_id = _sender
    );
  END IF;
  -- supervisor <-> supervisor: permitido
  IF s_sup AND r_sup THEN RETURN true; END IF;
  RETURN false;
END $$;

-- Helper para checar participação sem recursão
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conv uuid, _user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = _conv AND user_id = _user)
$$;

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv read participantes" ON public.conversations
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(id, auth.uid()) OR has_role(auth.uid(),'admin'));

CREATE POLICY "conv insert auth" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "cp read self" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_conversation_participant(conversation_id, auth.uid()) OR has_role(auth.uid(),'admin'));

CREATE POLICY "cp insert hierarquia" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    -- o criador pode adicionar a si mesmo
    user_id = auth.uid()
    OR has_role(auth.uid(),'admin')
    -- ou alguém com quem possa conversar, e quem está adicionando é participante criador
    OR (
      EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
      AND public.can_message(auth.uid(), user_id)
    )
  );

CREATE POLICY "cp update self" ON public.conversation_participants
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "msg read participantes" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()) OR has_role(auth.uid(),'admin'));

CREATE POLICY "msg insert participante hierarquia" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_participant(conversation_id, auth.uid())
    AND (
      has_role(auth.uid(),'admin')
      OR NOT EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversation_id
          AND cp.user_id <> auth.uid()
          AND NOT public.can_message(auth.uid(), cp.user_id)
      )
    )
  );

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- Trigger de notificação
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  sender_name text;
BEGIN
  SELECT nome INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notificacoes (user_id, titulo, mensagem, link)
  SELECT cp.user_id,
         'Nova mensagem de ' || COALESCE(sender_name,'usuário'),
         LEFT(COALESCE(NEW.conteudo, '[anexo]'), 120),
         '/app/mensagens?c=' || NEW.conversation_id::text
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id AND cp.user_id <> NEW.sender_id;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();
