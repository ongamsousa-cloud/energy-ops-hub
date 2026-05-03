-- 1. Corrigir função update_updated_at_column para segurança
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Políticas para service_order_media
CREATE POLICY "Admins can manage all media" ON public.service_order_media 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Technicians can insert media to their orders" ON public.service_order_media 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.service_orders 
            WHERE id = service_order_id AND technician_id = auth.uid()
        )
    );

CREATE POLICY "Technicians can view media of their orders" ON public.service_order_media 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.service_orders 
            WHERE id = service_order_id AND technician_id = auth.uid()
        )
    );

CREATE POLICY "Supervisors and Managers can view media of their departments" ON public.service_order_media 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.service_orders 
            WHERE id = service_order_id AND (
                supervisor_id = auth.uid() OR 
                manager_id = auth.uid() OR
                department_id IN (SELECT department_id FROM public.profiles WHERE id = auth.uid())
            )
        )
    );

-- 3. Políticas para service_order_history
CREATE POLICY "Everyone with access to the order can view history" ON public.service_order_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.service_orders 
            WHERE id = service_order_id AND (
                technician_id = auth.uid() OR
                supervisor_id = auth.uid() OR
                manager_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'auditor'))
            )
        )
    );

CREATE POLICY "Users can insert history logs" ON public.service_order_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Ajustes em teams e departments (RLS)
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Departments are viewable by all authenticated users" ON public.departments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teams are viewable by all authenticated users" ON public.teams
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage departments" ON public.departments FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage teams" ON public.teams FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
