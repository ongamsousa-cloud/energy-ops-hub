-- Update conversation_participants policies
DROP POLICY IF EXISTS "Users can manage participants" ON public.conversation_participants;
CREATE POLICY "Users can manage participants" 
ON public.conversation_participants 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Update conversations policies
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can see their conversations" ON public.conversations;
CREATE POLICY "Users can see their conversations" 
ON public.conversations 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = conversations.id AND user_id = auth.uid()
  )
);

-- Update messages policies
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
CREATE POLICY "Users can insert messages in their conversations" 
ON public.messages
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);

-- Ensure get_conversation_between_users RPC exists and works correctly
CREATE OR REPLACE FUNCTION public.get_conversation_between_users(user1 uuid, user2 uuid)
RETURNS TABLE (conversation_id uuid) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT cp1.conversation_id
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  JOIN public.conversations c ON c.id = cp1.conversation_id
  WHERE cp1.user_id = user1 
    AND cp2.user_id = user2 
    AND c.tipo = 'direct'
  GROUP BY cp1.conversation_id;
END;
$$;
