## Diagnóstico

Verifiquei o fluxo Obras → Ordens de Serviço e a base de dados. O que encontrei:

1. **A criação da OS funciona** (existem registros recentes em `ordens_servico` com `obra_id` e `numero` corretos).
2. **A listagem em `/app/os` (OSList.tsx) já busca todas as OS** sem filtro por departamento/obra para admin/gestor/supervisor — então o problema reportado ("não aparece") tem causas combinadas:
   - **Sem realtime / sem refetch**: a OSList carrega só no `mount`. Depois de criar a OS em "Obras", se a aba já estiver montada em cache (ou aberta em outra guia), não atualiza.
   - **Sem invalidação de cache** em queries (não usa React Query — cada página tem seu `useEffect` isolado).
   - **Sem notificação cruzada**: ao criar a OS, nenhum departamento (supervisor, almoxarife, financeiro) é avisado. Não há registro em `notificacoes` nem em filas de aprovação.
   - **Sem roteamento para os departamentos**: a OS nasce com `assigned_supervisor_id = null`, `equipe_id` opcional e sem vínculo com almoxarifado, então supervisores/almoxarifes não a veem em suas filas filtradas.
   - **Filtro padrão da OSList** mostra "Todos os Status" ✅, mas o card só renderiza `r.status` (não `operational_status`) — pode dar a sensação de "sumido" em status novos.
   - **Status inicial inconsistente**: dialog grava `status: 'iniciada'` + `operational_status: 'pendente'`, sem disparar nenhum hook downstream (estoque, financeiro, supervisor).

## Plano de Ação — Comunicação entre todas as seções

### 1. Camada de dados unificada (Realtime + cache)
- Adicionar **Supabase Realtime** em `ordens_servico`, `notificacoes`, `material_reservations`, `stock_movements`.
- Criar hook `useOrdens()` central (com refetch/subscribe) usado em: OSList, ObraDetalhe, Dashboard admin, Painel Supervisor, Painel Almoxarife, Painel Financeiro.
- Toda criação/edição de OS dispara `channel.send` para invalidar todos os consumidores.

### 2. Roteamento automático ao criar a OS
No `NewServiceOrderDialog.handleSave`, após inserir a OS:
- Se `equipe_id` informada → buscar `supervisor_id` da equipe e gravar em `assigned_supervisor_id`.
- Se nenhuma equipe → marcar `status='aguardando_atribuicao'` e criar alerta para gestores.
- Inserir em `notificacoes` para: supervisor designado, gestor da obra, almoxarife responsável, financeiro (uma linha por destinatário, com `link='/app/os/{id}'`).
- Criar reservas em `material_reservations` para os itens que demandam material (a partir de `os_atividades`).

### 3. Ajustes no banco (migrations)
- Trigger `fn_os_after_insert` em `ordens_servico` que:
  - Insere notificações para roles `supervisor`, `gestor`, `estoque`, `financeiro` ligados à obra/região.
  - Cria registro inicial em `financial_order_records` (status `aguardando_analise`).
  - Cria registro em `service_order_history` (status `criada`).
- Verificar/ajustar política RLS de `notificacoes` (insert por trigger SECURITY DEFINER).

### 4. UI consistente em todos os painéis
- **OSList** (`/app/os`): mostrar badge duplo (operacional + financeiro), filtro por obra, indicador "Nova" para OS criadas nas últimas 24h.
- **Dashboard Admin**: card "Últimas OS criadas" com link direto.
- **Painel Supervisor**: aba "OS recebidas" alimentada por `assigned_supervisor_id = auth.uid()` (já existe RLS).
- **Painel Almoxarife (Estoque)**: aba "Liberações pendentes" lendo `material_reservations` da OS.
- **Painel Financeiro**: aba "OS para análise" lendo `financial_order_records.financial_status='aguardando_analise'`.
- **ObraDetalhe**: após criar OS, refetch + toast com botão "Ver na lista de OS".

### 5. Notificação visual global
- Sino de notificações no `AppShell` (já há tabela `notificacoes`) com contador realtime e dropdown.
- Toast persistente quando uma OS chega para o usuário (subscribe em `notificacoes` filtrado por `user_id`).

### 6. Auditoria & Histórico
- Registrar em `audit_logs` cada transição de OS (criação, atribuição, liberação de material, validação financeira).
- Aba "Histórico" dentro de `OSDetalhe` lendo `service_order_history` + `audit_logs`.

## Entrega
Após sua aprovação, implemento na ordem: migrations (3) → hook + realtime (1) → roteamento dialog (2) → UI dos painéis (4,5) → histórico/auditoria (6). Todos os módulos passarão a se comunicar via os mesmos canais e tabelas centrais.