-- Table to track read status for each recipient
CREATE TABLE IF NOT EXISTS public.message_read_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

-- Policies for message_read_status
CREATE POLICY "Users can view read status of messages they sent or received"
ON public.message_read_status FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = message_id 
        AND (m.sender_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = m.conversation_id AND cp.user_id = auth.uid()
        ))
    )
);

CREATE POLICY "Users can insert their own read status"
ON public.message_read_status FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add delivered_at to messages if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'delivered_at') THEN
        ALTER TABLE public.messages ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Update conversation_participants to track last read
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_participants' AND column_name = 'last_read_at') THEN
        ALTER TABLE public.conversation_participants ADD COLUMN last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;
