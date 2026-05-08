ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS auditor_id UUID REFERENCES public.profiles(id);

-- Create a trigger or just handle it in the app. Let's do a trigger to keep supervisor IDs in sync if one is updated.
CREATE OR REPLACE FUNCTION sync_supervisor_ids()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.supervisor_id IS NOT NULL AND (OLD.supervisor_id IS NULL OR NEW.supervisor_id <> OLD.supervisor_id) THEN
    NEW.assigned_supervisor_id = NEW.supervisor_id;
  ELSIF NEW.assigned_supervisor_id IS NOT NULL AND (OLD.assigned_supervisor_id IS NULL OR NEW.assigned_supervisor_id <> OLD.assigned_supervisor_id) THEN
    NEW.supervisor_id = NEW.assigned_supervisor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_supervisor_ids ON public.ordens_servico;
CREATE TRIGGER tr_sync_supervisor_ids
BEFORE INSERT OR UPDATE ON public.ordens_servico
FOR EACH ROW EXECUTE FUNCTION sync_supervisor_ids();
