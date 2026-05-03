
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS unit_cost numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'confirmado',
  ADD COLUMN IF NOT EXISTS parent_movement_id uuid REFERENCES public.stock_movements(id),
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS supplier text,
  ADD COLUMN IF NOT EXISTS batch_number text;

CREATE TABLE IF NOT EXISTS public.material_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'reservado',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  released_at timestamptz
);
ALTER TABLE public.material_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservations read" ON public.material_reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "reservations write" ON public.material_reservations FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','gestor','supervisor','campo']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','gestor','supervisor','campo']::app_role[]));

CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  material_id uuid REFERENCES public.materials(id),
  warehouse_id uuid REFERENCES public.warehouses(id),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts read" ON public.stock_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "alerts write" ON public.stock_alerts FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','gestor','supervisor']::app_role[]))
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_levels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_alerts;

CREATE OR REPLACE FUNCTION public.fn_check_stock_alert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m RECORD;
BEGIN
  SELECT mt.name, mt.minimum_stock, mt.critical_stock INTO m
  FROM materials mt WHERE mt.id = NEW.material_id;
  IF m IS NULL THEN RETURN NEW; END IF;
  IF NEW.quantity <= COALESCE(m.critical_stock, 0) AND COALESCE(m.critical_stock,0) > 0 THEN
    INSERT INTO stock_alerts (alert_type, severity, material_id, warehouse_id, message)
    VALUES ('estoque_critico','high', NEW.material_id, NEW.warehouse_id,
      'Material ' || m.name || ' atingiu estoque CRÍTICO (' || NEW.quantity || ').');
  ELSIF NEW.quantity <= COALESCE(m.minimum_stock, 0) AND COALESCE(m.minimum_stock,0) > 0 THEN
    INSERT INTO stock_alerts (alert_type, severity, material_id, warehouse_id, message)
    VALUES ('estoque_minimo','medium', NEW.material_id, NEW.warehouse_id,
      'Material ' || m.name || ' abaixo do mínimo (' || NEW.quantity || ').');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_stock_alert ON public.stock_levels;
CREATE TRIGGER trg_stock_alert AFTER UPDATE ON public.stock_levels
FOR EACH ROW WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity)
EXECUTE FUNCTION public.fn_check_stock_alert();
