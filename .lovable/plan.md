## Diagnóstico

Verifiquei o código e o banco: **não existe nada de Comercial nem Pós-venda hoje**. Não há tabelas, páginas, rotas, roles ou dashboards relacionados. Vamos criar do zero, integrado ao que já existe (obras, OS, clientes, profissionais, notificações).

## O que será criado

### 1. Banco de dados (migração)

**Novos roles** no enum `app_role`: `comercial`, `posvenda`.

**Módulo Comercial — tabelas:**
- `clientes_comercial` — cadastro unificado de clientes/prospects (nome, CNPJ/CPF, contatos, segmento, origem, vínculo opcional com `obras`).
- `leads` — leads do funil (cliente, responsável comercial, valor estimado, temperatura).
- `oportunidades` — etapas do funil (prospecção → qualificação → proposta → negociação → ganho/perda), valor, probabilidade, data prevista de fechamento, motivo de perda.
- `propostas_comerciais` — propostas/orçamentos (número auto, cliente, oportunidade, itens em JSON, valor total, status: rascunho/enviada/aprovada/recusada, validade, anexo).
- `contratos` — contratos firmados (proposta de origem, vigência, valor, cliente, status).
- `metas_comerciais` — metas por vendedor/mês (valor meta, valor realizado calculado).
- `comercial_atividades` — log de interações (ligação, e-mail, reunião, visita) ligadas a lead/oportunidade.

**Módulo Pós-venda — tabelas:**
- `chamados_posvenda` — tickets (número auto, cliente, OS de origem opcional, categoria, prioridade, SLA, status: aberto/em_atendimento/aguardando_cliente/resolvido/fechado, responsável).
- `chamado_mensagens` — thread de comunicação do chamado.
- `garantias` — controle de garantia (OS de origem, prazo, status: vigente/expirada/acionada, motivo do acionamento).
- `retrabalhos` — registros de retrabalho ligados a uma OS, com custo e responsável.
- `pesquisas_satisfacao` — NPS/CSAT enviada após OS concluída (nota 0-10, comentário, categoria detratora/neutra/promotora).
- `cliente_interacoes_360` — view consolidada (obras + OS + chamados + propostas) por cliente.

**Integrações com o que já existe:**
- `propostas_comerciais.aprovada=true` → cria automaticamente uma `obra` (trigger).
- `ordens_servico.status='concluida'` → cria automaticamente registro de `garantias` (90 dias padrão) + dispara `pesquisas_satisfacao` (trigger + notificação).
- `chamados_posvenda` pode referenciar `ordens_servico.id` para rastreabilidade.
- Notificações automáticas no sino (`notificacoes`) para: novo lead atribuído, proposta aprovada, novo chamado, SLA estourando, nota NPS detratora.

**RLS / GRANTs:** todas as tabelas com RLS — admin/gestor veem tudo; `comercial` vê dados do módulo Comercial; `posvenda` vê chamados/garantias/NPS; `auditor` lê tudo; demais perfis sem acesso.

### 2. Frontend

**Novas páginas (`src/pages/`):**
- `ComercialDashboard.tsx` — KPIs (leads ativos, oportunidades por etapa, receita prevista vs. realizada, taxa de conversão, ranking de vendedores, funil visual).
- `ComercialLeads.tsx` — kanban de leads + lista.
- `ComercialOportunidades.tsx` — funil kanban por etapa.
- `ComercialPropostas.tsx` — listagem, criação e envio de propostas.
- `ComercialContratos.tsx` — contratos ativos.
- `ComercialClientes.tsx` — 360º do cliente.
- `PosVendaDashboard.tsx` — KPIs (chamados abertos, SLA, NPS médio, garantias vigentes, retrabalho %, satisfação por período).
- `PosVendaChamados.tsx` — lista + abertura + thread de atendimento.
- `PosVendaGarantias.tsx` — garantias vigentes/acionadas.
- `PosVendaSatisfacao.tsx` — relatórios NPS/CSAT.
- `PosVendaRetrabalhos.tsx` — controle de retrabalhos.

**Roteamento (`src/App.tsx`):** novas rotas em `/app/comercial/*` e `/app/posvenda/*` protegidas por roles `["admin","gestor","comercial"]` e `["admin","gestor","posvenda"]`.

**Menu lateral (`src/components/AppShell.tsx`):** dois novos itens — "Comercial" (ícone TrendingUp) e "Pós-venda" (ícone Headphones), visíveis apenas para perfis com acesso.

**Permissões (`src/shared/permissions/index.ts`):** novas chaves `COMERCIAL_VIEW`, `COMERCIAL_MANAGE`, `POSVENDA_VIEW`, `POSVENDA_MANAGE`.

**Auth (`src/lib/auth.tsx`):** adicionar `comercial` e `posvenda` ao tipo `AppRole` e ao `ROLE_LABEL`.

### 3. Usuários de teste

Reaproveitar a edge function `reset-test-passwords` para criar:

| E-mail | Senha | Perfil |
|---|---|---|
| `comercial@teste.com` | `senha123` | Comercial |
| `posvenda@teste.com` | `senha123` | Pós-venda |

Adicionar atalhos de login rápido em `src/pages/Login.tsx` para esses dois usuários (igual aos demais cargos já existentes).

## Detalhes técnicos

- Numeração: propostas `PRP-AAAA-####`, chamados `CHM-AAAA-####`, contratos `CTR-AAAA-####` — via trigger `BEFORE INSERT`.
- SLA: campo `sla_horas` em `chamados_posvenda` + cálculo de `sla_estourado` por trigger horário (cron simples via função).
- NPS: classificação automática (0-6 detrator, 7-8 neutro, 9-10 promotor) por coluna calculada.
- Realtime habilitado em `chamados_posvenda` e `oportunidades` para atualização ao vivo dos kanbans.
- Componentes UI reaproveitando padrões existentes (Card, Tabs, Badge, StatusBadge, EmptyState, PageHeader).

## Entrega ao final

Após implementação, envio as credenciais de acesso prontas para login:
- `comercial@teste.com` / `senha123`
- `posvenda@teste.com` / `senha123`

Posso seguir com a implementação?
