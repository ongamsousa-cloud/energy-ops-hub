
# Módulo de Estoque — Dashboard dedicado, operacional e rastreável

Hoje existe a página `MateriaisEstoque` mas ela é genérica, sem fluxo real de operação (não há cadastro de almoxarifado, nem lançamento guiado de entrada/saída/devolução, nem dashboard próprio com indicadores). As tabelas no banco já existem (`materials`, `material_categories`, `warehouses`, `stock_levels`, `stock_movements` com trigger automática `fn_update_stock_level`), mas estão praticamente vazias (1 almoxarifado, 3 materiais, 0 movimentações). Vou transformar o módulo num **centro de estoque completo**.

## O que vou construir

### 1. Rota dedicada `/app/estoque` com dashboard próprio
Substitui o atual `/app/materiais` por um hub completo com 6 abas:

```text
┌─ Visão Geral (KPIs) ─ Materiais ─ Almoxarifados ─ Movimentações ─ Reservas/OS ─ Alertas ─┐
```

- **KPIs no topo**: itens ativos, valor total em estoque (R$), itens em estoque crítico, itens abaixo do mínimo, reservas abertas, movimentações nas últimas 24h, perdas do mês, devoluções pendentes.
- **Gráficos**: entradas vs saídas (últimos 30 dias), top 10 materiais mais consumidos, consumo por equipe/profissional, materiais com maior risco de ruptura.
- **Lista "O que está acontecendo agora"**: feed em tempo real (Supabase Realtime no `stock_movements`) com "fulano retirou 5un do material X para a OS-000123", "ciclano devolveu 2un".

### 2. Telas de cadastro e lançamento (que hoje não existem)

- **Almoxarifados**: CRUD completo (nome, localização, responsável, fixo/móvel — ex.: van do técnico).
- **Materiais**: cadastro com categoria, unidade, custo, preço, estoque mínimo/crítico, foto, controle por número de série (sim/não), código interno.
- **Entrada de estoque** (compra/recebimento): nota fiscal, fornecedor, almoxarifado destino, lote, custo unitário — gera `stock_movements` tipo `entrada` e atualiza `stock_levels` automaticamente via trigger já existente.
- **Saída/Retirada para OS**: seleciona OS, profissional, almoxarifado origem, materiais e quantidades. Bloqueia se não houver saldo. Registra quem retirou, quando e para qual OS.
- **Devolução**: vincula à movimentação de saída original, registra quantidade devolvida, motivo (sobra, defeito, troca) e devolve ao saldo.
- **Transferência entre almoxarifados**: origem → destino, com aprovação.
- **Ajuste/Perda**: lançamento de perda, quebra ou ajuste de inventário com justificativa obrigatória e auditoria.

### 3. Integração ponta a ponta com Ordem de Serviço

- Na tela de **detalhe da OS**, aba "Materiais" passa a permitir **retirar material do estoque** diretamente, criando o `stock_movements` vinculado ao `os_id` e ao `professional_id`.
- Ao **finalizar a OS**, sistema pergunta se sobrou material e abre fluxo de devolução automática.
- Na **abertura da OS**, opção de **reservar materiais** (incrementa `reserved_quantity` em `stock_levels`).
- Notificações automáticas para o gestor quando: estoque atinge mínimo, há perda registrada, devolução pendente há mais de 48h.

### 4. Banco de dados — pequenos ajustes necessários

Migration adicionando o que falta para o fluxo funcionar de verdade:

- Tabela `material_reservations` (os_id, material_id, warehouse_id, quantity, status, created_by).
- Tabela `stock_entries` (NF, fornecedor, lote, vencimento) ligada a `stock_movements`.
- Colunas em `stock_movements`: `unit_cost`, `total_cost`, `reason`, `parent_movement_id` (para ligar devolução à saída original), `status` (pendente/confirmado).
- Tipo enum `stock_movement_type` ampliado para incluir `ajuste` e `perda` (se ainda não existir).
- View `vw_stock_dashboard` agregando KPIs para o dashboard.
- RLS: leitura para todos autenticados; escrita para `admin`, `gestor`, `supervisor` (saídas/devoluções também para `campo` quando vinculado à própria OS).
- Trigger de auditoria registrando todas as movimentações em `audit_logs`.

### 5. Dados de demonstração (seed)

Para você conseguir testar de verdade hoje, vou popular:
- 3 almoxarifados (Central, Van Equipe A, Van Equipe B).
- ~25 materiais reais do segmento elétrico (cabo 2,5mm², disjuntor 25A, poste, isolador, conector, etc.) com categorias.
- Saldos iniciais em cada almoxarifado.
- ~15 movimentações de exemplo (entradas, saídas para OS existentes, 1 devolução, 1 perda) para o dashboard já aparecer com gráficos preenchidos.

### 6. Credenciais de acesso para teste

Vou criar/garantir um usuário admin de demonstração e te entregar e-mail e senha após a implementação. Confirmação rápida antes:

- **E-mail sugerido**: `admin@demo.energyops.com`
- **Senha sugerida**: `Admin@2026`
- **Cargo**: Administrador (acesso total, incluindo o novo módulo de Estoque)

Se preferir outro e-mail/senha, me diga ao aprovar o plano. Caso contrário, sigo com esses.

## Detalhes técnicos

- **Realtime**: `ALTER PUBLICATION supabase_realtime ADD TABLE stock_movements, stock_levels;` para o feed ao vivo.
- **Validação**: zod em todos os formulários (quantidade > 0, almoxarifado obrigatório, justificativa em perda/ajuste).
- **Edge function** `stock-consume-os`: transação atômica que valida saldo, cria movimento e atualiza reserva — evita corridas quando dois técnicos retiram ao mesmo tempo.
- **Componentes novos**: `EstoqueDashboard.tsx`, `WarehousesTab.tsx`, `MaterialsTab.tsx`, `MovementsTab.tsx`, `ReservationsTab.tsx`, `AlertsTab.tsx`, `EntryDialog.tsx`, `WithdrawalDialog.tsx`, `ReturnDialog.tsx`, `TransferDialog.tsx`, `AdjustmentDialog.tsx`, `WarehouseDialog.tsx`.
- **Sidebar**: novo item "Estoque" com submenu (Dashboard, Materiais, Almoxarifados, Movimentações, Alertas) — separado de "Financeiro › Materiais" (que continua sendo a visão financeira).
- **Permissões**: admin/gestor veem tudo; supervisor vê seu almoxarifado/equipe; campo só vê o que é da própria OS; auditor/financeiro têm leitura total.

## Entrega ao final

1. Acesso `/app/estoque` funcional com dashboard, gráficos e feed ao vivo.
2. Todos os fluxos (entrada, saída para OS, devolução, transferência, perda) operando e refletindo em tempo real.
3. Integração visível na tela da OS (retirar/devolver material direto da OS).
4. Seed com dados realistas para você ver tudo populado.
5. E-mail e senha do admin de teste, prontos para login.
