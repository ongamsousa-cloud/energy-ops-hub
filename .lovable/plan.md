## Plano revisado — preservar todas as separações por departamento

Mantenho **integralmente** os dashboards e abas existentes (Admin, Gestor, Supervisor, Financeiro, Auditor, Campo, Estoque) e a aba "Estoque" dentro do AdminDashboard. O trabalho fica só em (1) conectar a comunicação entre departamentos e (2) substituir números fictícios por dados reais.

### Diagnóstico do banco hoje
- 24 OS no sistema, **0 supervisores atribuídos**, **0 notificações**, **0 reservas de material**, **0 registros financeiros**, **0 histórico**.
- O trigger `fn_os_after_insert` só age em OS novas → todo o histórico ficou órfão.
- Faltam triggers para os demais eventos (aprovação, reprovação, mensagem, alerta de estoque).

---

### Etapa A — Banco: triggers que faltam + backfill

**A1. Triggers novos (criados via migration):**
- `trg_os_status_route` em `ordens_servico` AFTER UPDATE OF status
  - status `correcao_solicitada`/`reprovada` → notifica `profissional_id`
  - status `aprovada` → notifica `financeiro` + `auditor` + popula `financial_order_records`
  - status `aguardando_revisao` → notifica `assigned_supervisor_id`
- `trg_stock_alert_notify` em `stock_alerts` AFTER INSERT → notifica roles `estoque` + `gestor` + `admin`
- `trg_os_message_notify` em `os_messages` AFTER INSERT → notifica supervisor/profissional da OS
- `trg_os_atividade_reserve` em `os_atividades` AFTER INSERT → cria `material_reservations` quando atividade tem materiais previstos (status `reservado`, almoxarife libera depois)
- Todos gravam linha em `service_order_history` para a timeline.

**A2. Backfill (via insert tool):**
- Preencher `assigned_supervisor_id` nas 24 OS atuais a partir de `equipes.supervisor_id`.
- Criar `financial_order_records` para todas OS já aprovadas.
- Disparar 1 notificação "catch-up" para gestores/supervisores das OS pendentes.

---

### Etapa B — Frontend: trocar mocks por dados reais (sem remover abas)

Mantém todas as seções; só substitui os números fixos:

| Arquivo | O que troca |
|---|---|
| `Dashboard.tsx` | Remover `weeklyNewOS` hardcoded (datas 27/04→03/05) e calcular a partir de `ordens_servico.created_at` dos últimos 7 dias |
| `AdminDashboard.tsx` | Eficiência mock 85% → calcular `osAprov/(osAprov+osRejeitadas)` real |
| `FinanceiroOrdens.tsx` | Card "Margem Média 62%" → calcular de `financial_order_records` (approved_value vs estimated_cost). Coluna `valor_aprovado` (campo inexistente) → usar `financial.approved_value` |
| `FinanceiroMateriais.tsx` | "Consumo Mensal +12.4%" e "Itens Extras 05" → calcular de `os_materials` + `stock_movements`. Mostrar materiais reais (não atividades) |
| `FinanceiroDashboard.tsx` | Mantém tudo; só conecta o card "Pendências" ao `financial_order_records` real |

Nada é apagado; cada dashboard/aba continua existindo com sua identidade.

---

### Etapa C — Comunicação cruzada entre departamentos

Sem mover nenhuma página, adiciono os elos:

```text
┌────────────┐  cria OS   ┌────────────┐ assigned   ┌────────────┐
│  ADMIN /   │──────────►│ ordens_    │───────────►│ SUPERVISOR │
│  GESTOR    │            │ servico    │            │ (Aprovações)│
└────────────┘            └────┬───────┘            └────┬───────┘
                               │ trg_os_atividade        │ aprova
                               ▼                          ▼
                        ┌────────────┐           ┌────────────────┐
                        │  ESTOQUE   │           │   FINANCEIRO   │
                        │ (reservas) │           │ (records auto) │
                        └─────┬──────┘           └────────┬───────┘
                              │ libera                     │
                              ▼                            ▼
                        ┌────────────┐           ┌────────────────┐
                        │   CAMPO    │           │    AUDITOR     │
                        │ (executa)  │           │ (revisa pós-OK)│
                        └────────────┘           └────────────────┘
```

Cada seta vira uma linha em `notificacoes` com `link` direto para a OS de origem — o `NotificationBell` (já existente) e o realtime já cuidam da exibição instantânea.

---

### Etapa D — Menu/AppShell (não-destrutivo)

- Mantém todos os itens do menu.
- Adiciona **badge de contador realtime** ao lado dos itens "Aprovações", "Estoque", "Financeiro/Ordens" e "Mensagens", lendo `notificacoes` não-lidas filtrando pelo prefixo do `link` (ex.: `/app/aprovacoes`, `/app/estoque`, etc.). Assim cada departamento sabe quando tem coisa nova sem mistura.

---

### Etapa E — OSDetalhe como hub (sem reescrever)

Adições, sem remover nada do que já está:
- Linha do tempo lendo `service_order_history` (Etapa A já popula).
- Bloco "Reservas de Material" lendo `material_reservations` da OS.
- Bloco "Status Financeiro" lendo `financial_order_records`.

---

### Ordem de execução (uma única passada)
1. Migration: triggers da Etapa A1.
2. Inserts/updates de backfill (Etapa A2).
3. Frontend: substituir mocks (Etapa B).
4. Frontend: badges no AppShell (Etapa D).
5. Frontend: blocos novos no OSDetalhe (Etapa E).
6. Teste end-to-end: criar OS no Admin → conferir notificação no Supervisor, reserva no Estoque, registro no Financeiro, log no Auditor.

Confirma para eu implementar nessa ordem?