
# Sistema de Gestão de Serviços de Energia Elétrica

Plataforma web/PWA completa para controle de obras, ordens de serviço, equipes, atividades técnicas, produtividade por UMD, evidências, aprovações e medição. Construída sobre Lovable Cloud (auth, banco, storage, edge functions).

Aviso de escopo: este é um sistema grande. Vou entregar tudo numa única implementação organizada em fases dentro do mesmo build, mas é natural que ajustes finos venham em iterações. Recomendo testar fase por fase.

---

## Identidade visual

- Estilo: minimalista, técnico, sofisticado — sem cara de "template IA". Tipografia Inter, muito espaço em branco, bordas finas, cantos sutis (radius 8px), sem ícones ilustrados/coloridos. Ícones lineares Lucide em peso fino, monocromáticos.
- Paleta neutra com um único acento:
  - Fundo `#FAFAF9`, superfícies `#FFFFFF`, borda `#E7E5E4`
  - Texto `#0A0A0A` / secundário `#57534E`
  - Acento (ações primárias) `#1E293B` (slate quase preto, premium)
  - Status: aprovado `#15803D`, pendente `#A16207`, reprovado `#B91C1C`, info `#1D4ED8`
- Sem gradientes, sem sombras pesadas. Tabelas densas, cards com hairline border. Layout mobile com bottom-tab discreto.

---

## Fases de implementação

### Fase 1 — Fundação (Cloud + Auth + RBAC)
- Ativar Lovable Cloud.
- Tabelas: `profiles`, `roles` (enum: admin, gestor, supervisor, campo, financeiro, auditor), `user_roles` (separada, com `has_role()` security definer), `audit_logs`, `notifications`, `settings`.
- Trigger de criação de profile no signup.
- Tela de login limpa, recuperar senha, página `/reset-password`.
- Redirecionamento por perfil. Guard de rota e menu dinâmico por role.
- Seed de 4 usuários de teste (admin, supervisor, campo, financeiro).

### Fase 2 — Cadastros mestres
- CRUD `obras` (com status, endereço, coordenadas, responsáveis, anexos).
- CRUD `equipes` + `equipe_membros` + vínculo a obras.
- CRUD `profissionais` (extensão de profiles + cargo, especialidade, equipe).
- CRUD `categorias` (seed com as 23 categorias do PRD).
- Página de detalhes de cada entidade com abas (dados, histórico, indicadores).

### Fase 3 — Atividades + Importação Excel
- Tabela `atividades` (categoria, código item, descrição, unidade, UMD unitária, flags de foto/localização obrigatórias).
- Tela de importação: upload `.xlsx`, parse client-side com SheetJS, mapeamento de colunas (Tipo→categoria, Item→código, Atividades→descrição, Unidade, Quantidade de UMD), prévia, validação, dedupe por código, criação automática de categorias inexistentes, relatório de importação.
- Busca/filtro/favoritos de atividades.

### Fase 4 — Ordem de Serviço (núcleo)
- Tabelas `ordens_servico` e `os_atividades` com todos os campos do PRD e enum de status.
- Fluxo campo: iniciar OS (nome auto-preenchido, número de obra com busca/QR), capturar geo inicial, selecionar categoria → atividade → quantidade, cálculo automático de UMD (qtd × UMD unitária, travado), foto antes/durante/depois, observação, geo do lançamento, salvar item, repetir, finalizar.
- Validações: campos obrigatórios, fotos exigidas, geo exigida, OS sem item não finaliza.
- Tela mobile otimizada (cards grandes, poucos cliques, bottom nav).

### Fase 5 — Evidências + Geolocalização
- Bucket Storage `evidencias` (privado, RLS por OS/role) com compressão de imagem no client.
- Captura via `<input capture>` ou upload, registro de timestamp e geo no metadata.
- Galeria por OS, lightbox, links para mapa (Google Maps via lat/lng).

### Fase 6 — Aprovação / Reprovação / Correção
- Painel do supervisor: fila de OS aguardando revisão, detalhe com checklist, ações Aprovar / Reprovar (motivo obrigatório) / Solicitar Correção (observação obrigatória).
- Estados travam edição conforme regras. Notificação interna ao profissional.

### Fase 7 — Dashboards por perfil
- Cards de KPI + gráficos (Recharts): UMD por mês, OS por status, ranking equipe/profissional, atividades mais executadas, obras com maior volume.
- Filtros: período, obra, equipe, profissional, status, categoria.
- Variantes: Admin, Operacional, Supervisor, Campo (simplificado), Financeiro, Auditor.

### Fase 8 — Relatórios + Medição
- Gerador de relatório com filtros completos (período, obra, OS, equipe, profissional, supervisor, categoria, item, status, unidade).
- Tipos: diário, por obra, profissional, equipe, categoria, atividade, item, UMD executada/aprovada, OS aprovadas/reprovadas, pendências, evidências, auditoria, medição.
- Exportar Excel (SheetJS), CSV, PDF (jsPDF + autoTable) com cabeçalho profissional.
- Módulo de fechamento de medição: `medicoes` + `medicao_itens`, status (aberta/conferência/fechada/exportada), considera apenas OS aprovadas.

### Fase 9 — Auditoria + Notificações
- `audit_logs` populado por triggers em todas tabelas críticas (login, CRUD obras/profissionais/atividades, ações de OS, importações, exportações).
- Visualização cronológica filtrável; exportação.
- Centro de notificações no topbar (sino, badge, lista).

### Fase 10 — PWA + Offline
- Manifest, ícones, instalação, service worker (com guards de iframe/preview, NetworkFirst para HTML, denylist `/~oauth`).
- Fila offline (IndexedDB via Dexie): salvar OS, lançamentos e fotos localmente; sincronização automática quando online; indicador de status; resolução de conflito por timestamp; impede duplicidade via UUID local.

---

## Modelo de dados (resumo)

`profiles, user_roles, obras, equipes, equipe_membros, profissionais, categorias, atividades, ordens_servico, os_atividades, evidencias, localizacoes, aprovacoes, medicoes, medicao_itens, audit_logs, notifications, anexos, settings`.

Regras: FKs com restrição, soft-delete (campo `ativo`/`deleted_at`), índices em número da obra, número da OS, código do item, status, datas, profissional, equipe. RLS em todas as tabelas alinhada às permissões por role (campo só vê suas OS, supervisor só vê das equipes vinculadas, admin vê tudo).

---

## Stack / detalhes técnicos

- React + Vite + TS + Tailwind + shadcn/ui (já no projeto).
- Lovable Cloud: Postgres + Auth + Storage + Edge Functions.
- React Router para áreas Auth / App / Campo.
- TanStack Query para cache.
- Recharts para gráficos. SheetJS (xlsx) para Excel. jsPDF + autoTable para PDF. Dexie para offline. react-hook-form + zod para validação.
- Edge functions: importação Excel em lote, geração de medição, exportação de relatório PDF pesado, recompactação de evidências.

---

## O que você precisa providenciar

1. Planilha `.xlsx` com as ~553 atividades (anexar no chat após aprovar o plano — importarei no seed).
2. Confirmar se quer logo customizada agora ou se gero um wordmark tipográfico minimalista temporário.

Pronto para implementar quando você aprovar.
