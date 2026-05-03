# Comunicação interna hierárquica + evidências do técnico

## Objetivo
Adicionar um módulo de **Mensagens** dentro do sistema, respeitando a hierarquia:
- **Administrador / Gestor** → conversam com todos
- **Supervisor** → conversa com Gestor (acima) e Técnicos da sua equipe (abaixo)
- **Técnico (campo)** → conversa **apenas** com seu Supervisor
- **Financeiro / Auditor** → conversam com Admin e Gestor

E reforçar a captura de **foto e vídeo** pelo técnico, anexada à OS, salva no banco de evidências (já existe `os_evidences` + bucket `os-evidences`).

---

## 1. Banco de dados (migração)

Criar duas tabelas:

**`conversations`**
- `id uuid pk`
- `tipo text` ('direct' | 'grupo_obra')
- `obra_id uuid null` (para chats vinculados a uma obra)
- `criada_em timestamptz default now()`

**`conversation_participants`**
- `conversation_id uuid`
- `user_id uuid`
- `ultima_leitura timestamptz`
- PK composta

**`messages`**
- `id uuid pk`
- `conversation_id uuid`
- `sender_id uuid`
- `conteudo text`
- `anexo_url text null` (foto/vídeo opcional)
- `anexo_tipo text null` ('image' | 'video')
- `created_at timestamptz default now()`

**Função SQL `can_message(sender uuid, receiver uuid) returns boolean`** que valida a hierarquia consultando `user_roles` e (para supervisor↔técnico) a tabela `equipe_membros` + `equipes.supervisor_id`. Usada nas policies de INSERT.

**RLS**:
- SELECT em `messages` / `conversations`: somente participantes (`exists` em `conversation_participants`).
- INSERT em `messages`: participante **e** `can_message(sender, qualquer outro participante)` = true.
- INSERT em `conversation_participants` validado pela mesma regra.

**Realtime**: `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;`

## 2. Storage para anexos de mensagens
Reusar bucket `os-evidences` (público) com prefixo `chat/{conversation_id}/...` para foto/vídeo enviados no chat. Limite por arquivo (vídeo) tratado no front: até 100 MB no chat (vídeos longos continuam na evidência da OS, com até 1 GB).

## 3. Frontend — nova página `/app/mensagens`

- Item no `AppShell` (visível para todos os papéis), com badge de não lidas.
- Layout duas colunas:
  - **Esquerda**: lista de conversas + botão "Nova conversa" → abre lista filtrada pelo papel:
    - Admin/Gestor: todos os usuários ativos
    - Supervisor: Gestores + técnicos da(s) equipe(s) que ele supervisiona
    - Técnico: apenas o(s) supervisor(es) da sua equipe
    - Financeiro/Auditor: Admin + Gestor
  - **Direita**: mensagens + input com botões 📎 foto / 🎥 vídeo / enviar.
- Subscrição realtime para inserir novas mensagens ao vivo e marcar como lida.

## 4. Captura de foto/vídeo pelo técnico (reforço na OS)

Em `src/pages/OSDetalhe.tsx`, na aba de evidências:
- Botão **"Tirar foto"** → `<input type="file" accept="image/*" capture="environment">`.
- Botão **"Gravar vídeo"** → `<input type="file" accept="video/*" capture="environment">`.
- Captura GPS via `navigator.geolocation` no upload (já existe util `getGeo`).
- Upload para bucket `os-evidences` em `os/{os_id}/...`, registro em `os_evidences` (campos `tipo`, `url`, `localizacao`, `metadata` com size/mime).
- Política existente já bloqueia DELETE/UPDATE → evidências imutáveis (atende "não pode ser apagado").
- Botão **Baixar** por evidência (link direto do bucket público).

## 5. Notificações
Quando uma mensagem é inserida, trigger insere em `notificacoes` para cada participante ≠ remetente (título "Nova mensagem de X").

## 6. Auth/permissões já existentes
Usaremos `has_role` / `has_any_role` já presentes. Nenhuma mudança em auth.

---

## Arquivos a criar/alterar
- **Migração SQL** (tabelas, função, RLS, realtime, trigger de notificação).
- **`src/pages/Mensagens.tsx`** (nova).
- **`src/components/chat/`** (`ConversationList.tsx`, `MessageThread.tsx`, `NewConversationDialog.tsx`).
- **`src/components/AppShell.tsx`**: adicionar item "Mensagens".
- **`src/App.tsx`**: rota `/app/mensagens`.
- **`src/pages/OSDetalhe.tsx`**: botões de captura foto/vídeo + lista com download (refinar UI da aba evidências).

## Resultado
Hierarquia de conversas garantida no banco (RLS) e na UI; técnico só fala com supervisor; admin/gestor enxergam todos; técnico continua podendo anexar fotos e vídeos diretamente na OS, com GPS e sem possibilidade de exclusão.
