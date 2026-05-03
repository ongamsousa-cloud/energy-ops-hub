-- 1) Categorias de Materiais
CREATE TABLE IF NOT EXISTS public.material_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Materiais
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES public.material_categories(id),
  unit text NOT NULL DEFAULT 'un',
  cost_price numeric(12,2) NOT NULL DEFAULT 0,
  sale_price numeric(12,2) NOT NULL DEFAULT 0,
  minimum_stock numeric(12,2) NOT NULL DEFAULT 0,
  critical_stock numeric(12,2) NOT NULL DEFAULT 0,
  is_serial_tracked boolean DEFAULT false,
  photo_url text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Almoxarifados
CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  location text,
  is_mobile boolean DEFAULT false,
  responsible_id uuid REFERENCES auth.users(id),
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Níveis de Estoque
CREATE TABLE IF NOT EXISTS public.stock_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity numeric(12,2) NOT NULL DEFAULT 0,
  reserved_quantity numeric(12,2) NOT NULL DEFAULT 0,
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(material_id, warehouse_id)
);

-- 5) Movimentações
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_movement_type') THEN
    CREATE TYPE stock_movement_type AS ENUM ('entrada', 'saida', 'transferencia', 'ajuste', 'devolucao', 'reserva');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES public.materials(id) NOT NULL,
  from_warehouse_id uuid REFERENCES public.warehouses(id),
  to_warehouse_id uuid REFERENCES public.warehouses(id),
  quantity numeric(12,2) NOT NULL,
  type stock_movement_type NOT NULL,
  os_id uuid REFERENCES public.ordens_servico(id),
  professional_id uuid REFERENCES public.profiles(id),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6) Materiais da OS
CREATE TABLE IF NOT EXISTS public.os_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) NOT NULL,
  quantity_planned numeric(12,2) NOT NULL DEFAULT 0,
  quantity_used numeric(12,2) NOT NULL DEFAULT 0,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_materials ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura
DO $$ BEGIN
  CREATE POLICY "Read for all" ON public.material_categories FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Read for all" ON public.materials FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Read for all" ON public.warehouses FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Read for all" ON public.stock_levels FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Read for all" ON public.stock_movements FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Read for all" ON public.os_materials FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Políticas de Escrita (Simplificadas para evitar erros de função)
DO $$ BEGIN
  CREATE POLICY "Write for staff" ON public.materials FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Insert for all" ON public.stock_movements FOR INSERT TO authenticated 
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Trigger para atualizar saldos
CREATE OR REPLACE FUNCTION public.fn_update_stock_level()
RETURNS trigger AS $$
BEGIN
  IF NEW.type = 'entrada' OR (NEW.type = 'transferencia' AND NEW.to_warehouse_id IS NOT NULL) THEN
    INSERT INTO public.stock_levels (material_id, warehouse_id, quantity)
    VALUES (NEW.material_id, NEW.to_warehouse_id, NEW.quantity)
    ON CONFLICT (material_id, warehouse_id) 
    DO UPDATE SET quantity = stock_levels.quantity + NEW.quantity, last_updated_at = now();
  END IF;

  IF NEW.type = 'saida' OR (NEW.type = 'transferencia' AND NEW.from_warehouse_id IS NOT NULL) THEN
    UPDATE public.stock_levels 
    SET quantity = quantity - NEW.quantity, last_updated_at = now()
    WHERE material_id = NEW.material_id AND warehouse_id = NEW.from_warehouse_id;
  END IF;

  IF NEW.type = 'devolucao' AND NEW.to_warehouse_id IS NOT NULL THEN
    UPDATE public.stock_levels 
    SET quantity = quantity + NEW.quantity, last_updated_at = now()
    WHERE material_id = NEW.material_id AND warehouse_id = NEW.to_warehouse_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_after_stock_movement ON public.stock_movements;
CREATE TRIGGER trg_after_stock_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_stock_level();

-- Dados Iniciais
INSERT INTO public.material_categories (name) VALUES 
('Cabos e Condutores'), ('Postes e Ferragens'), ('Transformadores'), 
('Proteção e Manobra'), ('Iluminação Pública'), ('EPI / EPC'), ('Ferramentas')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.warehouses (name, location) VALUES ('Almoxarifado Central', 'Sede Principal') ON CONFLICT (name) DO NOTHING;
