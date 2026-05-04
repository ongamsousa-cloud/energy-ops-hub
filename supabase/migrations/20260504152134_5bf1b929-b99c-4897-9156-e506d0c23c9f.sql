
-- 1. conversations.department_id + tipo 'department'
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_department_unique
  ON public.conversations (department_id)
  WHERE department_id IS NOT NULL;

-- 2. messages.updated_at + trigger
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_messages_updated_at ON public.messages;
CREATE TRIGGER trg_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Políticas de UPDATE/DELETE para autor
DROP POLICY IF EXISTS "Authors can update their messages" ON public.messages;
CREATE POLICY "Authors can update their messages"
ON public.messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete their messages" ON public.messages;
CREATE POLICY "Authors can delete their messages"
ON public.messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- 4. Permitir SELECT da conversa de departamento aos membros do depto
DROP POLICY IF EXISTS "Department members can see department conversation" ON public.conversations;
CREATE POLICY "Department members can see department conversation"
ON public.conversations FOR SELECT
TO authenticated
USING (
  department_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.department_id = conversations.department_id
  )
);

-- 5. RPC: obter/criar conversa de departamento
CREATE OR REPLACE FUNCTION public.get_or_create_department_conversation(_department_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id uuid;
  v_dept_name text;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT id INTO v_conv_id
  FROM public.conversations
  WHERE department_id = _department_id
  LIMIT 1;

  IF v_conv_id IS NULL THEN
    SELECT name INTO v_dept_name FROM public.departments WHERE id = _department_id;
    INSERT INTO public.conversations (tipo, titulo, department_id, created_by)
    VALUES ('department', COALESCE(v_dept_name, 'Departamento'), _department_id, v_uid)
    RETURNING id INTO v_conv_id;
  END IF;

  -- Garante o remetente como participante
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (v_conv_id, v_uid)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  -- Garante todos os profissionais ativos do departamento como participantes
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  SELECT v_conv_id, p.id
  FROM public.profiles p
  WHERE p.department_id = _department_id AND p.ativo = true
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_department_conversation(uuid) TO authenticated;
