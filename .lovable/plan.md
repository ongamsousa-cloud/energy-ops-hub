# Plano de Implementação — Sistema OS (12 itens)

Plano dividido em 4 frentes para entregar tudo de forma coerente: **Design System**, **Dashboard do Gestor**, **Fluxo de OS** e **Atribuição & Correção**.

---

## Frente 1 — Design System Vermelho (itens 1, 2, 4, 5)

### 1.1 Tokens de cor (src/index.css + tailwind.config.ts)
- Refinar `--primary` (vermelho `0 72% 51%`) e adicionar variantes:
  - `--primary-hover` (`0 72% 45%`)
  - `--primary-active` (`0 72% 40%`)
  - `--primary-disabled` (`0 30% 75%`)
  - `--primary-foreground` garantido em `0 0% 100%` (contraste AA ≥ 4.5:1 em ambos temas)
- Ajustar variantes no `dark` mode para manter legibilidade.
- Atualizar `--ring` para derivar do vermelho (foco visível).

### 1.2 Botões e links (src/components/ui/button.tsx + globals)
- Atualizar `buttonVariants`:
  - `default`: `bg-primary hover:bg-[hsl(var(--primary-hover))] active:bg-[hsl(var(--primary-active))] disabled:bg-[hsl(var(--primary-disabled))] focus-visible:ring-primary`
  - `destructive`: alinhar ao mesmo vermelho (consolidar tons).
  - `link` e `ghost`: `hover:text-primary`, sublinhado vermelho.
- Garantir `text-primary-foreground` em todos os estados (sem texto branco sobre vermelho-claro).

### 1.3 Badges, Alertas e StatusBadge (src/components/StatusBadge.tsx, ui/badge.tsx, ui/alert.tsx)
- Padronizar paleta semântica via tokens (`destructive`, `warning`, `success`, `info`) — todos derivados do mesmo design system.
- Status críticos (`reprovada`, `critica`, `nao_executada`) usam vermelho primário sólido.

### 1.4 Pop-ups (Dialog) — Obra e Nova OS
- Em `NewServiceOrderDialog.tsx`, `ObraDetalhe.tsx` e demais dialogs principais:
  - Header com borda inferior vermelha.
  - Botão de ação primária em vermelho com hover/focus consistente.
  - Ícones de destaque em `text-primary`.

### 1.5 Personalização da cor (item 3)
- Nova tabela `app_settings` (key/value JSON) com chave `theme.primary_color` (HSL string).
- Tela em **Admin → Configurações** para escolher cor (color picker + presets).
- Hook `useAppTheme()` que lê o setting, converte para HSL e injeta `--primary` / `--primary-hover` / `--primary-active` em `document.documentElement.style`.
- Aplicado no `App.tsx` no boot. RLS: leitura pública autenticada, escrita só `admin`.

---

## Frente 2 — Dashboard do Gestor (itens 6, 7, 8)

### 2.1 Filtro de período (item 6)
- Componente `<PeriodFilter>` reutilizável: presets (7/30/90 dias) + `DateRangePicker` (shadcn calendar).
- Estado em `GestorDashboard.tsx` propagado para todas as queries (`fim_em >= start AND <= end`).
- Recalcula `umdHistory` e `byStatus` ao mudar.

### 2.2 Drill-down nos gráficos (item 7)
- No `BarChart` de status, `onClick` da barra abre Sheet lateral `<OSDrillDownSheet>`:
  - Lista paginada de OS daquele status no período.
  - Filtros: obra (select), equipe (select), profissional (select).
  - Cada linha navega para `/app/os/:id`.
- Mesma mecânica no gráfico de UMD (clique em ponto → OS aprovadas naquele mês).

### 2.3 Aba dedicada de OS no Dashboard (item 8)
- Adicionar `<Tabs>` no topo do dashboard: **Visão Geral | Ordens de Serviço | Equipes**.
- Aba "Ordens de Serviço":
  - Botão **Nova OS** (abre `NewServiceOrderDialog` já existente, conectado ao catálogo `categorias` + `atividades`).
  - Tabela com filtros (status, obra, profissional, período), busca por número.
  - KPIs no topo: abertas, em revisão, aprovadas, reprovadas.
  - Acompanhamento em tempo real via Supabase Realtime na tabela `ordens_servico`.

---

## Frente 3 — Criação e Detalhe de OS (itens 9, 10, 11)

### 3.1 Cálculo de UMD com preview (item 9)
- Em `NewServiceOrderDialog.tsx` / `OSNova.tsx`:
  - Ao escolher categoria → carregar atividades. Ao escolher atividade → buscar `umd_unitaria` e `unidade`.
  - Campo `quantidade` → preview ao vivo: `UMD total = umd_unitaria * quantidade`, `Valor estimado = UMD * valor_umd` (de `financial_rules`).
  - Lista de atividades adicionadas com soma total + barra de produtividade (vs meta diária do profissional).
  - Validações: quantidade > 0, atividade ativa, categoria coerente, obrigatoriedade de campos definidos em `atividades.exige_*`.

### 3.2 Timeline no detalhe da OS (item 10)
- Em `OSDetalhe.tsx`, nova seção `<OSTimeline>`:
  - Fonte: `os_audit_logs` (já existente) + `service_order_history` + comentários internos.
  - Renderiza eventos cronológicos com ícone por tipo (criação, atribuição, início, foto, aprovação, reprovação, correção solicitada, correção enviada, aprovação final).
  - Cada item: autor (avatar+nome), data/hora, descrição, comentário e diff de status (badge antes → badge depois).

### 3.3 Validação rigorosa de evidências (item 11)
- Regras (config em `financial_rules` chave `evidence_rules`):
  - Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/quicktime`.
  - Tamanho: imagem ≤ 10MB, vídeo ≤ 100MB.
  - Mínimo por atividade: respeita `exige_foto_antes`, `exige_foto_durante`, `exige_foto_depois` em `atividades`.
  - Mínimo geral: 2 fotos "depois" + 1 vídeo opcional.
- Validação client-side no upload (toast de erro) **e** validação server-side via edge function `validate-os-evidence` chamada antes de aprovar.
- Botão **Aprovar** em `OSDetalhe.tsx` fica `disabled` enquanto `evidenceComplete === false`, com tooltip listando o que falta.

---

## Frente 4 — Atribuição e Fluxo de Correção (item 12)

### 4.1 Atribuição de equipe/profissional
- Na criação/edição da OS:
  - Select de **Equipe** (filtra equipes ativas da obra via `obra_equipes`).
  - Select de **Profissional** (membros da equipe via `equipe_membros`).
  - Auto-preenche `assigned_supervisor_id` pelo `equipes.supervisor_id`.
- Ação rápida "Reatribuir" no detalhe (admin/gestor/supervisor).

### 4.2 Encaminhamento automático para correção
- Trigger PostgreSQL `on_os_status_change`:
  - Quando `status` muda para `reprovada` ou `correcao_solicitada`:
    - Atualiza `status` para `correcao_solicitada`.
    - Insere em `os_audit_logs` o motivo.
    - Cria notificação em `notificacoes` para o `profissional_id` com link `/app/os/:id`.
    - Cria registro em `service_order_history`.
- No app:
  - Dashboard do técnico mostra card "Correções pendentes" com badge vermelho.
  - Botão "Enviar correção" no detalhe muda status para `corrigida` e notifica o supervisor automaticamente.

---

## Detalhes técnicos

**Migrations necessárias:**
1. `app_settings` (id, key unique, value jsonb, updated_by, updated_at) + RLS.
2. Trigger `on_os_status_change` para roteamento de correções e notificações.
3. Seed em `financial_rules`: `evidence_rules` com tipos/tamanhos/mínimos.

**Edge function:**
- `validate-os-evidence`: recebe `os_id`, retorna `{ ok, missing: [...] }`.

**Componentes novos:**
- `src/components/PeriodFilter.tsx`
- `src/components/dashboard/OSDrillDownSheet.tsx`
- `src/components/dashboard/OSDashboardTab.tsx`
- `src/components/os/OSTimeline.tsx`
- `src/components/os/EvidenceValidator.tsx`
- `src/hooks/useAppTheme.ts`
- `src/pages/admin/Configuracoes.tsx` (cor primária)

**Componentes alterados:**
- `src/index.css`, `tailwind.config.ts`, `src/components/ui/button.tsx`, `src/components/StatusBadge.tsx`
- `src/pages/Dashboard.tsx`, `src/components/dashboards/GestorDashboard.tsx`, `AdminDashboard.tsx`
- `src/components/os/NewServiceOrderDialog.tsx`, `src/pages/OSNova.tsx`, `src/pages/OSDetalhe.tsx`, `src/pages/ObraDetalhe.tsx`
- `src/App.tsx` (boot do tema)

**Pacotes:** sem novas dependências (já há recharts, date-fns, calendar shadcn).

---

Posso prosseguir com a implementação de todas as 4 frentes em sequência?