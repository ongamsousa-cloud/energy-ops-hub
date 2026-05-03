
-- =============================
-- ENUMS
-- =============================
CREATE TYPE public.app_role AS ENUM ('admin','gestor','supervisor','campo','financeiro','auditor');
CREATE TYPE public.obra_status AS ENUM ('aberta','planejamento','execucao','pausada','aguardando_material','aguardando_aprovacao','concluida','cancelada');
CREATE TYPE public.os_status AS ENUM ('rascunho','iniciada','em_andamento','finalizada','aguardando_revisao','em_revisao','correcao_solicitada','corrigida','aprovada','reprovada','faturada','cancelada');
CREATE TYPE public.lancamento_status AS ENUM ('pendente','aprovado','reprovado','correcao');

-- =============================
-- PROFILES
-- =============================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  cpf TEXT,
  cargo TEXT,
  especialidade TEXT,
  foto_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_acesso TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================
-- USER ROLES
-- =============================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles)) $$;

-- Trigger para criar profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email);
  -- default role campo
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'campo');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger generic
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================
-- CATEGORIAS
-- =============================
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ordem INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_categorias_updated BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================
-- ATIVIDADES
-- =============================
CREATE TABLE public.atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
  codigo_item TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  unidade TEXT NOT NULL,
  umd_unitaria NUMERIC(12,4) NOT NULL DEFAULT 0,
  exige_foto_antes BOOLEAN NOT NULL DEFAULT false,
  exige_foto_durante BOOLEAN NOT NULL DEFAULT false,
  exige_foto_depois BOOLEAN NOT NULL DEFAULT true,
  exige_localizacao BOOLEAN NOT NULL DEFAULT true,
  observacao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_atividades_categoria ON public.atividades(categoria_id);
CREATE INDEX idx_atividades_codigo ON public.atividades(codigo_item);
CREATE TRIGGER trg_atividades_updated BEFORE UPDATE ON public.atividades FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================
-- OBRAS
-- =============================
CREATE TABLE public.obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  cliente TEXT,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  data_inicio DATE,
  previsao_conclusao DATE,
  data_conclusao DATE,
  responsavel_tecnico TEXT,
  supervisor_id UUID REFERENCES public.profiles(id),
  status obra_status NOT NULL DEFAULT 'aberta',
  descricao TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_obras_numero ON public.obras(numero);
CREATE INDEX idx_obras_status ON public.obras(status);
CREATE TRIGGER trg_obras_updated BEFORE UPDATE ON public.obras FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================
-- EQUIPES
-- =============================
CREATE TABLE public.equipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE,
  supervisor_id UUID REFERENCES public.profiles(id),
  regiao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_equipes_updated BEFORE UPDATE ON public.equipes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.equipe_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id UUID NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  funcao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (equipe_id, profissional_id)
);
ALTER TABLE public.equipe_membros ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.obra_equipes (
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  equipe_id UUID NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
  PRIMARY KEY (obra_id, equipe_id)
);
ALTER TABLE public.obra_equipes ENABLE ROW LEVEL SECURITY;

-- =============================
-- ORDENS DE SERVICO
-- =============================
CREATE SEQUENCE public.os_numero_seq;

CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE DEFAULT ('OS-' || lpad(nextval('public.os_numero_seq')::text, 6, '0')),
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE RESTRICT,
  profissional_id UUID NOT NULL REFERENCES public.profiles(id),
  equipe_id UUID REFERENCES public.equipes(id),
  supervisor_id UUID REFERENCES public.profiles(id),
  status os_status NOT NULL DEFAULT 'iniciada',
  inicio_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  fim_em TIMESTAMPTZ,
  inicio_lat NUMERIC(10,7),
  inicio_lng NUMERIC(10,7),
  fim_lat NUMERIC(10,7),
  fim_lng NUMERIC(10,7),
  observacoes TEXT,
  motivo_reprovacao TEXT,
  observacao_supervisor TEXT,
  aprovado_por UUID REFERENCES public.profiles(id),
  aprovado_em TIMESTAMPTZ,
  total_umd NUMERIC(14,4) NOT NULL DEFAULT 0,
  total_umd_aprovada NUMERIC(14,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_os_obra ON public.ordens_servico(obra_id);
CREATE INDEX idx_os_prof ON public.ordens_servico(profissional_id);
CREATE INDEX idx_os_status ON public.ordens_servico(status);
CREATE INDEX idx_os_data ON public.ordens_servico(inicio_em);
CREATE TRIGGER trg_os_updated BEFORE UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================
-- LANCAMENTOS DE ATIVIDADE
-- =============================
CREATE TABLE public.os_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  atividade_id UUID NOT NULL REFERENCES public.atividades(id),
  categoria_id UUID NOT NULL REFERENCES public.categorias(id),
  quantidade NUMERIC(14,4) NOT NULL CHECK (quantidade > 0),
  umd_unitaria NUMERIC(12,4) NOT NULL,
  umd_total NUMERIC(14,4) NOT NULL,
  unidade TEXT NOT NULL,
  observacao TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  status lancamento_status NOT NULL DEFAULT 'pendente',
  observacao_supervisor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.os_atividades ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_lanc_os ON public.os_atividades(os_id);
CREATE INDEX idx_lanc_atividade ON public.os_atividades(atividade_id);

-- Recalcula total UMD da OS
CREATE OR REPLACE FUNCTION public.recalc_os_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE _os UUID;
BEGIN
  _os := COALESCE(NEW.os_id, OLD.os_id);
  UPDATE public.ordens_servico
  SET total_umd = COALESCE((SELECT SUM(umd_total) FROM public.os_atividades WHERE os_id = _os),0),
      total_umd_aprovada = COALESCE((SELECT SUM(umd_total) FROM public.os_atividades WHERE os_id = _os AND status='aprovado'),0)
  WHERE id = _os;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_lanc_totals AFTER INSERT OR UPDATE OR DELETE ON public.os_atividades FOR EACH ROW EXECUTE FUNCTION public.recalc_os_totals();

-- =============================
-- EVIDENCIAS
-- =============================
CREATE TABLE public.evidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  os_atividade_id UUID REFERENCES public.os_atividades(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'depois',
  storage_path TEXT NOT NULL,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.evidencias ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ev_os ON public.evidencias(os_id);

-- =============================
-- NOTIFICACOES
-- =============================
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  link TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- =============================
-- AUDIT LOGS
-- =============================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  acao TEXT NOT NULL,
  modulo TEXT,
  registro_id TEXT,
  dados JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================
-- RLS POLICIES
-- =============================
-- Helpers
-- profiles
CREATE POLICY "profiles select self/admin" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','gestor','supervisor','auditor','financeiro']::app_role[])
);
CREATE POLICY "profiles update self/admin" ON public.profiles FOR UPDATE TO authenticated USING (
  id = auth.uid() OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "profiles insert admin" ON public.profiles FOR INSERT TO authenticated WITH CHECK (
  id = auth.uid() OR public.has_role(auth.uid(),'admin')
);

-- user_roles: only admin manages, user can read own
CREATE POLICY "user_roles read" ON public.user_roles FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "user_roles admin write" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- categorias / atividades / obras / equipes / equipe_membros / obra_equipes: read all auth, write admin/gestor
CREATE POLICY "cat read" ON public.categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "cat write" ON public.categorias FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));

CREATE POLICY "ativ read" ON public.atividades FOR SELECT TO authenticated USING (true);
CREATE POLICY "ativ write" ON public.atividades FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));

CREATE POLICY "obras read" ON public.obras FOR SELECT TO authenticated USING (true);
CREATE POLICY "obras write" ON public.obras FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));

CREATE POLICY "equipes read" ON public.equipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "equipes write" ON public.equipes FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));

CREATE POLICY "em read" ON public.equipe_membros FOR SELECT TO authenticated USING (true);
CREATE POLICY "em write" ON public.equipe_membros FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));

CREATE POLICY "oe read" ON public.obra_equipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "oe write" ON public.obra_equipes FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[]));

-- ordens_servico
CREATE POLICY "os read scoped" ON public.ordens_servico FOR SELECT TO authenticated USING (
  profissional_id = auth.uid()
  OR supervisor_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin','gestor','auditor','financeiro','supervisor']::app_role[])
);
CREATE POLICY "os insert" ON public.ordens_servico FOR INSERT TO authenticated WITH CHECK (
  profissional_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','gestor','supervisor']::app_role[])
);
CREATE POLICY "os update" ON public.ordens_servico FOR UPDATE TO authenticated USING (
  (profissional_id = auth.uid() AND status IN ('iniciada','em_andamento','correcao_solicitada','corrigida','rascunho'))
  OR public.has_any_role(auth.uid(), ARRAY['admin','gestor','supervisor']::app_role[])
);
CREATE POLICY "os delete admin" ON public.ordens_servico FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- os_atividades: same scope as parent OS
CREATE POLICY "lanc read" ON public.os_atividades FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.ordens_servico o WHERE o.id = os_id AND (
    o.profissional_id = auth.uid() OR o.supervisor_id = auth.uid() OR
    public.has_any_role(auth.uid(), ARRAY['admin','gestor','auditor','financeiro','supervisor']::app_role[])
  ))
);
CREATE POLICY "lanc write" ON public.os_atividades FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.ordens_servico o WHERE o.id = os_id AND (
    o.profissional_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','gestor','supervisor']::app_role[])
  ))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.ordens_servico o WHERE o.id = os_id AND (
    o.profissional_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','gestor','supervisor']::app_role[])
  ))
);

-- evidencias
CREATE POLICY "ev read" ON public.evidencias FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.ordens_servico o WHERE o.id = os_id AND (
    o.profissional_id = auth.uid() OR o.supervisor_id = auth.uid() OR
    public.has_any_role(auth.uid(), ARRAY['admin','gestor','auditor','financeiro','supervisor']::app_role[])
  ))
);
CREATE POLICY "ev write" ON public.evidencias FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.ordens_servico o WHERE o.id = os_id AND (
    o.profissional_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','gestor','supervisor']::app_role[])
  ))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.ordens_servico o WHERE o.id = os_id AND (
    o.profissional_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','gestor','supervisor']::app_role[])
  ))
);

-- notificacoes
CREATE POLICY "notif read self" ON public.notificacoes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif update self" ON public.notificacoes FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif insert any auth" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (true);

-- audit_logs
CREATE POLICY "audit read" ON public.audit_logs FOR SELECT TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['admin','auditor','gestor']::app_role[])
);
CREATE POLICY "audit insert any" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- =============================
-- STORAGE: bucket evidencias (privado)
-- =============================
INSERT INTO storage.buckets (id, name, public) VALUES ('evidencias','evidencias', false) ON CONFLICT DO NOTHING;

CREATE POLICY "ev storage read auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'evidencias');
CREATE POLICY "ev storage insert auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evidencias');
CREATE POLICY "ev storage update own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'evidencias' AND owner = auth.uid());
CREATE POLICY "ev storage delete admin" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'evidencias' AND public.has_role(auth.uid(),'admin'));

-- =============================
-- SEED categorias
-- =============================
INSERT INTO public.categorias (nome, ordem) VALUES
('Escavação de Poste',1),('Instalação de Poste',2),('Base do Poste',3),
('Estrutura de Alta Trifásica',4),('Estrutura de Alta Monofásica',5),('Estrutura de Alta Antigos',6),
('Estrutura de Baixa Tensão',7),('Instalação de Transformador',8),
('Instalar Conjunto com Chave Faca',9),('Instalar Conjunto com Transformador',10),
('Instalação de Para Raios e Chaves',11),('Lançamento de Condutor',12),
('Estrutura de Estai',13),('Aterramento',14),('Conectores',15),
('Instalação de Equipamento Especiais',16),('Instalação de Iluminação Pública',17),
('Roçada e Limpeza',18),('Inspeção',19),('Ligação de Consumidores',20),
('Transporte',21),('Sobreaviso',22),('Outros',23);
