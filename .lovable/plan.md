
# Auditoria honesta dos dashboards e plano de correção

Antes de prometer "tudo refeito", aqui está o que está REALMENTE quebrado hoje no código (verificado linha a linha) e o que será corrigido.

## Diagnóstico (problemas confirmados)

### Críticos (quebram o sistema)
1. `src/components/dashboards/AuditorDashboard.tsx` — JSX escrito FORA do `return`, antes da declaração de `dataPie`. O arquivo não compila quando o auditor entra. Por isso o dashboard do auditor "não existe" na prática.
2. `src/App.tsx` — `FinanceiroOrdens` e `FinanceiroMateriais` são importados mas **nenhuma rota** está registrada. Qualquer link para `/app/financeiro/ordens` ou `/app/financeiro/materiais` cai em 404.

### Dashboard do Técnico (CampoDashboard)
3. Não há botão de foto/vídeo no próprio dashboard. O técnico precisa entrar numa OS, achar a aba "Evidências" e só lá vê os botões. Vou adicionar uma ação rápida de **captura de foto/vídeo direto do dashboard**, ligada à OS ativa do técnico.
4. Cards mostram `osAbertas` que vem hardcoded como `0` em `Dashboard.tsx` (linha 98). Vou calcular de verdade (status `iniciada` + `em_andamento` do técnico logado).
5. Listagem "Minhas Atividades Recentes" só mostra OS criadas — não filtra por status que o técnico aceitou. Vou separar **"OS aceitas/em execução"** de **"aguardando aceite"**.

### Dashboard do Gestor/Supervisor (GestorDashboard)
6. Card "Status das Equipes" usa o mesmo número (`osPend`) em duas linhas diferentes ("Em execução" e "Aguardando validação"). Dado duplicado/falso.
7. "Em deslocamento" mostra `osAbertas` que é sempre 0.
8. "Alertas Operacionais" tem dois alertas **escritos no código** ("OS #10293", "OS #10442"). Vou trocar por dados reais de `operational_alerts` (tabela já existe).

### Dashboard do Admin (AdminDashboard)
9. "Crescimento de +2% este mês" e "Produtividade em alta" são strings fixas — vou calcular variação real comparando 30 dias atuais vs 30 dias anteriores.

### Dashboard Financeiro (FinanceiroDashboard)
10. "Previsão R$" usa `umd * 12.5` chumbado. Vou ler de `financial_rules` (tabela existe) o valor unitário do UMD; se não houver, mostrar "—" em vez de mentir.
11. "Divergências: 0" hardcoded. Vou contar `financial_order_records` com `financial_status = 'divergente'`.
12. Cards usam `stats.umd` global em vez de somar `financial_order_records.approved_value`.

### Dashboard do Auditor
13. Reescrever o arquivo do zero (está sintaticamente quebrado). Conectar a `audit_cases`, `audit_findings` e `os_audit_logs` reais (números de casos abertos, achados por severidade, fila de revisão).

### Mídia / Evidências (técnico)
14. Bucket `os-evidences` está sem `file_size_limit` — usuário pediu até 1 GB. Vou definir `1073741824`.
15. Não há policy impedindo delete em `os_evidences` (a regra do usuário: nunca apagar). Vou adicionar política RLS bloqueando DELETE para todos os roles e usar coluna `deleted_at` apenas como soft-flag para auditor (sem remover storage).
16. Fluxo de upload em `OSDetalhe` já existe mas não captura GPS de forma síncrona com a foto, e não mostra progresso para vídeos grandes. Vou adicionar: indicador de progresso, exigência de GPS antes do envio quando `atividade.exige_localizacao`.

## O que vai ser feito (ordem de execução)

1. **Corrigir build:** reescrever `AuditorDashboard.tsx` com estrutura JSX válida e dados reais.
2. **Registrar rotas faltantes** (`financeiro/ordens`, `financeiro/materiais`) com proteção por role.
3. **Reescrever `Dashboard.tsx`** para calcular `osAbertas`, variação mensal de UMD, divergências, alertas reais — uma única query consolidada por role.
4. **CampoDashboard:** adicionar bloco "Ação rápida de campo" com botões nativos `<input capture="environment">` para foto e vídeo, ligados à OS em execução do técnico (se houver). Separar listas "Em execução" vs "Aguardando aceite".
5. **GestorDashboard:** trocar "Status das Equipes" e "Alertas Operacionais" por dados reais (`operational_alerts` + contagens corretas por status).
6. **AdminDashboard:** calcular % real de crescimento (mês atual vs anterior) e remover textos fixos.
7. **FinanceiroDashboard:** ler `financial_rules` para valor do UMD; contar divergências de `financial_order_records`; somar `approved_value` em vez de `total_umd`.
8. **AuditorDashboard:** cards de casos abertos / achados por severidade / OS aguardando auditoria; lista das últimas auditorias reais.
9. **Migration:**
   - `update storage.buckets set file_size_limit = 1073741824 where id = 'os-evidences';`
   - Policy `revoke delete` em `os_evidences` para todos.
10. **OSDetalhe (upload):** validar GPS quando exigido, mostrar barra de progresso para arquivos > 10 MB, bloquear botão durante upload.

## Estrutura técnica resumida

```text
Dashboard.tsx
 └─ buildStatsForRole(role, userId)
     ├─ campo:    OSs do user, mídia recente, OS ativa
     ├─ supervisor: OSs da equipe + alertas
     ├─ gestor:   tudo + variação mensal
     ├─ financeiro: financial_order_records + financial_rules
     └─ auditor:  audit_cases + findings + logs
```

Não vou alterar visual (cores/animações já agradam) — só substituir dados falsos por reais e consertar o que está quebrado.

## Fora do escopo desta rodada
- Reescrever totalmente o sistema de mensageria entre roles (já funciona via `os_messages` e `conversations`).
- Implementar exportação CSV/PDF de relatórios (já tem página `Relatorios.tsx` que precisa de auditoria separada).

Posso prosseguir?
