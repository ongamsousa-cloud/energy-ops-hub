-- 1. Fix trigger function with type casting
CREATE OR REPLACE FUNCTION public.log_os_status_change_v3()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) OR (OLD.operational_status IS DISTINCT FROM NEW.operational_status) THEN
        INSERT INTO public.os_audit_logs (
            os_id,
            user_id,
            status_anterior,
            status_novo,
            comentario,
            created_at
        ) VALUES (
            NEW.id,
            auth.uid(),
            OLD.status::text,
            NEW.status::text,
            'Mudança técnica: ' || COALESCE(NEW.operational_status::text, NEW.status::text),
            now()
        );
    END IF;
    RETURN NEW;
END;
$function$;

-- 2. Trigger to ensure umd_total integrity
CREATE OR REPLACE FUNCTION public.ensure_umd_total_integrity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.umd_total := NEW.quantidade * NEW.umd_unitaria;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_os_atividades_integrity ON public.os_atividades;
CREATE TRIGGER trg_os_atividades_integrity
BEFORE INSERT OR UPDATE ON public.os_atividades
FOR EACH ROW EXECUTE FUNCTION public.ensure_umd_total_integrity();

-- 3. Recalculate existing totals
UPDATE public.os_atividades SET umd_total = quantidade * umd_unitaria;

-- 4. Fix operational status values
UPDATE public.ordens_servico 
SET operational_status = 'iniciada' 
WHERE status = 'iniciada' AND (operational_status IS NULL OR operational_status::text != 'iniciada');
