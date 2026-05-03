-- Function to handle stock updates and validations
CREATE OR REPLACE FUNCTION public.handle_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_available NUMERIC;
    v_withdrawn NUMERIC;
    v_returned NUMERIC;
    v_remaining NUMERIC;
    v_min_stock NUMERIC;
    v_critical_stock NUMERIC;
BEGIN
    -- 1. Validations for "Saida" (Withdrawal)
    IF NEW.type = 'saida' THEN
        -- Check if source warehouse has enough quantity
        SELECT quantity INTO v_available 
        FROM public.stock_levels 
        WHERE material_id = NEW.material_id AND warehouse_id = NEW.from_warehouse_id;
        
        IF v_available IS NULL OR v_available < NEW.quantity THEN
            RAISE EXCEPTION 'Saldo insuficiente no almoxarifado selecionado. Disponível: %, Solicitado: %', COALESCE(v_available, 0), NEW.quantity;
        END IF;
    END IF;

    -- 2. Validations for "Devolucao" (Return)
    IF NEW.type = 'devolucao' AND NEW.parent_movement_id IS NOT NULL THEN
        -- Get original withdrawal quantity
        SELECT quantity INTO v_withdrawn 
        FROM public.stock_movements 
        WHERE id = NEW.parent_movement_id;
        
        -- Get already returned quantity for this parent
        SELECT SUM(quantity) INTO v_returned 
        FROM public.stock_movements 
        WHERE parent_movement_id = NEW.parent_movement_id AND type = 'devolucao' AND id != NEW.id;
        
        v_remaining := v_withdrawn - COALESCE(v_returned, 0);
        
        IF NEW.quantity > v_remaining THEN
            RAISE EXCEPTION 'Quantidade de devolução excede o saldo remanescente da retirada original. Disponível para devolução: %', v_remaining;
        END IF;
    END IF;

    -- 3. Update stock_levels based on movement type
    
    -- Decrease from source
    IF NEW.from_warehouse_id IS NOT NULL THEN
        UPDATE public.stock_levels 
        SET quantity = quantity - NEW.quantity,
            last_updated_at = now()
        WHERE material_id = NEW.material_id AND warehouse_id = NEW.from_warehouse_id;
        
        IF NOT FOUND THEN
             -- This should not happen for 'saida' due to validation above, but handles other types
            INSERT INTO public.stock_levels (material_id, warehouse_id, quantity)
            VALUES (NEW.material_id, NEW.from_warehouse_id, -NEW.quantity);
        END IF;
    END IF;

    -- Increase at destination
    IF NEW.to_warehouse_id IS NOT NULL THEN
        UPDATE public.stock_levels 
        SET quantity = quantity + NEW.quantity,
            last_updated_at = now()
        WHERE material_id = NEW.material_id AND warehouse_id = NEW.to_warehouse_id;
        
        IF NOT FOUND THEN
            INSERT INTO public.stock_levels (material_id, warehouse_id, quantity)
            VALUES (NEW.material_id, NEW.to_warehouse_id, NEW.quantity);
        END IF;
    END IF;

    -- 4. Check for Stock Alerts
    SELECT minimum_stock, critical_stock INTO v_min_stock, v_critical_stock
    FROM public.materials WHERE id = NEW.material_id;

    -- Check new level in affected warehouses
    FOR v_available IN 
        SELECT SUM(quantity) FROM public.stock_levels WHERE material_id = NEW.material_id
    LOOP
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
$$ LANGUAGE plpgsql;

-- Trigger for stock movements
DROP TRIGGER IF EXISTS trigger_handle_stock_movement ON public.stock_movements;
CREATE TRIGGER trigger_handle_stock_movement
AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.handle_stock_movement();

-- Ensure demo user has proper role
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Try to find the user
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'estoque@energyops.demo';
    
    IF v_user_id IS NOT NULL THEN
        -- Upsert role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Update profile cargo
        UPDATE public.profiles SET cargo = 'estoque' WHERE id = v_user_id;
    END IF;
END $$;
