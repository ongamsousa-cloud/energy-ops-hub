-- 1. Correcting os_status enum if needed (ensure 'rascunho' exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'os_status' AND e.enumlabel = 'rascunho') THEN
        ALTER TYPE public.os_status ADD VALUE 'rascunho' BEFORE 'iniciada';
    END IF;
END $$;

-- 2. Improve Stock Trigger to handle DELETE and UPDATE
CREATE OR REPLACE FUNCTION public.handle_stock_movement()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_available NUMERIC;
    v_withdrawn NUMERIC;
    v_returned NUMERIC;
    v_remaining NUMERIC;
    v_min_stock NUMERIC;
    v_critical_stock NUMERIC;
    v_qty_to_change NUMERIC;
BEGIN
    -- Handle DELETE or OLD values for UPDATE
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
        -- Reverse effect of OLD movement
        IF OLD.from_warehouse_id IS NOT NULL THEN
            UPDATE public.stock_levels SET quantity = quantity + OLD.quantity WHERE material_id = OLD.material_id AND warehouse_id = OLD.from_warehouse_id;
        END IF;
        IF OLD.to_warehouse_id IS NOT NULL THEN
            UPDATE public.stock_levels SET quantity = quantity - OLD.quantity WHERE material_id = OLD.material_id AND warehouse_id = OLD.to_warehouse_id;
        END IF;
    END IF;

    -- If DELETE, we stop here
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;

    -- Handle INSERT or NEW values for UPDATE
    
    -- Validations for "Saida"
    IF NEW.type = 'saida' THEN
        SELECT quantity INTO v_available FROM public.stock_levels WHERE material_id = NEW.material_id AND warehouse_id = NEW.from_warehouse_id;
        IF v_available IS NULL OR v_available < NEW.quantity THEN
            RAISE EXCEPTION 'Saldo insuficiente no almoxarifado selecionado. Disponível: %, Solicitado: %', COALESCE(v_available, 0), NEW.quantity;
        END IF;
    END IF;

    -- Apply NEW movement effect
    IF NEW.from_warehouse_id IS NOT NULL THEN
        UPDATE public.stock_levels SET quantity = quantity - NEW.quantity, last_updated_at = now() 
        WHERE material_id = NEW.material_id AND warehouse_id = NEW.from_warehouse_id;
        IF NOT FOUND THEN
            INSERT INTO public.stock_levels (material_id, warehouse_id, quantity) VALUES (NEW.material_id, NEW.from_warehouse_id, -NEW.quantity);
        END IF;
    END IF;

    IF NEW.to_warehouse_id IS NOT NULL THEN
        UPDATE public.stock_levels SET quantity = quantity + NEW.quantity, last_updated_at = now() 
        WHERE material_id = NEW.material_id AND warehouse_id = NEW.to_warehouse_id;
        IF NOT FOUND THEN
            INSERT INTO public.stock_levels (material_id, warehouse_id, quantity) VALUES (NEW.material_id, NEW.to_warehouse_id, NEW.quantity);
        END IF;
    END IF;

    -- Stock Alerts check
    SELECT minimum_stock, critical_stock INTO v_min_stock, v_critical_stock FROM public.materials WHERE id = NEW.material_id;
    FOR v_available IN SELECT SUM(quantity) FROM public.stock_levels WHERE material_id = NEW.material_id LOOP
        IF v_available <= v_critical_stock THEN
            INSERT INTO public.stock_alerts (material_id, warehouse_id, alert_type, message, status)
            VALUES (NEW.material_id, COALESCE(NEW.from_warehouse_id, NEW.to_warehouse_id), 'ruptura', 'Material em nível crítico ou ruptura: ' || v_available, 'open');
        ELSIF v_available <= v_min_stock THEN
            INSERT INTO public.stock_alerts (material_id, warehouse_id, alert_type, message, status)
            VALUES (NEW.material_id, COALESCE(NEW.from_warehouse_id, NEW.to_warehouse_id), 'minimo', 'Material atingiu nível mínimo: ' || v_available, 'open');
        END IF;
    END LOOP;

    RETURN NEW;
END;
$function$;

-- Update trigger definition to include DELETE and UPDATE
DROP TRIGGER IF EXISTS trigger_handle_stock_movement ON public.stock_movements;
CREATE TRIGGER trigger_handle_stock_movement 
BEFORE INSERT OR UPDATE OR DELETE ON public.stock_movements 
FOR EACH ROW EXECUTE FUNCTION public.handle_stock_movement();

-- 3. Tighten RLS for employees (Managers can manage employees)
DROP POLICY IF EXISTS "Managers can manage employees" ON public.employees;
CREATE POLICY "Managers can manage employees" 
ON public.employees 
FOR ALL 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role]));

-- 4. Fix potential orphan profiles (Profiles are SELECTABLE by anyone, which is fine for UI, but tightening write)
DROP POLICY IF EXISTS "profiles update self/admin" ON public.profiles;
CREATE POLICY "profiles update self/admin" 
ON public.profiles 
FOR UPDATE 
USING ((id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
