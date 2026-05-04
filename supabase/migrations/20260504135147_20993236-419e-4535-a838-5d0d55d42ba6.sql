-- Update handle_new_user to set ativo = true by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, ativo)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)), 
    NEW.email, 
    true -- Set to true by default
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, ativo = true;
  RETURN NEW;
END $$;

-- Activate all current profiles
UPDATE public.profiles SET ativo = true WHERE ativo = false;

-- Ensure we only have one trigger for notifications
DROP TRIGGER IF EXISTS trg_message_notification ON public.messages;
CREATE TRIGGER trg_message_notification
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_message();
