-- Create employees table with all requested fields
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    document_cpf TEXT UNIQUE,
    email TEXT UNIQUE,
    phone TEXT,
    internal_company_code TEXT UNIQUE,
    service_code TEXT UNIQUE,
    job_title TEXT,
    department_id UUID REFERENCES public.departments(id),
    department_name TEXT,
    operational_role TEXT,
    employee_type TEXT DEFAULT 'field_worker',
    access_level TEXT DEFAULT 'employee',
    status TEXT DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    can_access_system BOOLEAN DEFAULT false,
    can_receive_service_orders BOOLEAN DEFAULT true,
    can_manage_materials BOOLEAN DEFAULT false,
    can_close_service_orders BOOLEAN DEFAULT false,
    can_view_financial_data BOOLEAN DEFAULT false,
    can_view_reports BOOLEAN DEFAULT false,
    admission_date DATE,
    termination_date DATE,
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table to link employees to Service Orders
CREATE TABLE IF NOT EXISTS public.service_order_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_internal_code TEXT NOT NULL,
    employee_service_code TEXT NOT NULL,
    role_in_service TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    started_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'assigned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for audit logs
CREATE TABLE IF NOT EXISTS public.employee_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Function to auto-generate codes
CREATE OR REPLACE FUNCTION public.generate_employee_codes()
RETURNS TRIGGER AS $$
DECLARE
    next_seq INTEGER;
BEGIN
    -- Internal Company Code (FUNC-0001 format)
    IF NEW.internal_company_code IS NULL THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(internal_company_code FROM 6) AS INTEGER)), 0) + 1 
        INTO next_seq 
        FROM public.employees 
        WHERE internal_company_code LIKE 'FUNC-%';
        
        NEW.internal_company_code := 'FUNC-' || LPAD(next_seq::TEXT, 4, '0');
    END IF;

    -- Service Code (TEC-001 format as default if not set)
    IF NEW.service_code IS NULL THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(service_code FROM 5) AS INTEGER)), 0) + 1 
        INTO next_seq 
        FROM public.employees 
        WHERE service_code LIKE 'TEC-%';
        
        NEW.service_code := 'TEC-' || LPAD(next_seq::TEXT, 3, '0');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generation
DROP TRIGGER IF EXISTS tr_generate_employee_codes ON public.employees;
CREATE TRIGGER tr_generate_employee_codes
BEFORE INSERT ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.generate_employee_codes();

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for employees
CREATE POLICY "Users can view employees in their company" ON public.employees
    FOR SELECT USING (true);

CREATE POLICY "Managers can manage employees" ON public.employees
    FOR ALL USING (auth.role() = 'authenticated');

-- Policies for service_order_employees
CREATE POLICY "Users can view service order assignments" ON public.service_order_employees
    FOR SELECT USING (true);

CREATE POLICY "Managers can manage service order assignments" ON public.service_order_employees
    FOR ALL USING (auth.role() = 'authenticated');

-- Policies for audit logs
CREATE POLICY "Only admins can view audit logs" ON public.employee_audit_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert audit logs" ON public.employee_audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create trigger for updated_at on employees
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
