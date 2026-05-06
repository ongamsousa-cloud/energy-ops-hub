-- Add title and description to ordens_servico
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS titulo TEXT,
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Enhance os_audit_logs for better traceability
ALTER TABLE public.os_audit_logs
ADD COLUMN IF NOT EXISTS action TEXT,
ADD COLUMN IF NOT EXISTS from_department_id UUID REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS to_department_id UUID REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;

-- Ensure department_tasks has status
ALTER TABLE public.department_tasks
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente';
