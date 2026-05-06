-- Ensure the profiles and employees synchronization trigger exists
CREATE OR REPLACE FUNCTION public.sync_employee_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET 
        nome = COALESCE(NEW.full_name, nome),
        email = COALESCE(NEW.email, email),
        telefone = COALESCE(NEW.phone, telefone),
        cpf = COALESCE(NEW.document_cpf, cpf),
        rg = COALESCE(NEW.document_rg, rg),
        cargo = COALESCE(NEW.job_title, cargo),
        data_nascimento = COALESCE(NEW.birth_date, data_nascimento),
        data_admissao = COALESCE(NEW.admission_date, data_admissao),
        cep = COALESCE(NEW.postal_code, cep),
        endereco_residencial = COALESCE(NEW.residential_address, endereco_residencial),
        bairro = COALESCE(NEW.neighborhood, bairro),
        cidade = COALESCE(NEW.city, cidade),
        estado = COALESCE(NEW.state, estado),
        foto_url = COALESCE(NEW.photo_url, foto_url),
        department_id = COALESCE(NEW.department_id, department_id),
        updated_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to keep profile updated when employee record changes
DROP TRIGGER IF EXISTS tr_sync_employee_to_profile ON public.employees;
CREATE TRIGGER tr_sync_employee_to_profile
AFTER UPDATE ON public.employees
FOR EACH ROW
WHEN (NEW.user_id IS NOT NULL)
EXECUTE FUNCTION public.sync_employee_to_profile();

-- Function to automatically create an audit log entry for OS status changes
CREATE OR REPLACE FUNCTION public.log_os_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
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
            OLD.status,
            NEW.status,
            'Status alterado automaticamente pelo sistema.',
            now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for OS status change logging
DROP TRIGGER IF EXISTS tr_log_os_status_change ON public.ordens_servico;
CREATE TRIGGER tr_log_os_status_change
AFTER UPDATE ON public.ordens_servico
FOR EACH ROW
EXECUTE FUNCTION public.log_os_status_change();

-- Ensure all necessary columns exist in profiles if they were missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rg') THEN
        ALTER TABLE public.profiles ADD COLUMN rg TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'data_nascimento') THEN
        ALTER TABLE public.profiles ADD COLUMN data_nascimento DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'endereco_residencial') THEN
        ALTER TABLE public.profiles ADD COLUMN endereco_residencial TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bairro') THEN
        ALTER TABLE public.profiles ADD COLUMN bairro TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'cidade') THEN
        ALTER TABLE public.profiles ADD COLUMN cidade TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'estado') THEN
        ALTER TABLE public.profiles ADD COLUMN estado TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'cep') THEN
        ALTER TABLE public.profiles ADD COLUMN cep TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'data_admissao') THEN
        ALTER TABLE public.profiles ADD COLUMN data_admissao DATE;
    END IF;
END $$;
