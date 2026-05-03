
CREATE OR REPLACE FUNCTION public.fn_audit_log_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, acao, modulo, registro_id, dados)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END,
    jsonb_build_object(
      'old', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
      'new', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    )
  );
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END $$;
