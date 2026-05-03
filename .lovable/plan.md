## Problema

No pop-up atual de "Nova Mensagem":
- O usuário precisa **primeiro** clicar em um profissional para só então ver o campo de digitar/gravar.
- Quando o filtro por departamento (ex: "Gestor Operacional") não retorna ninguém, aparece "Nenhum profissional encontrado" e **não há nenhuma forma de escrever/gravar**.
- Não é possível enviar para um departamento inteiro (broadcast), o que será necessário quando houver vários supervisores, técnicos, etc.

## O que será implementado

Redesenho do `DialogContent` em `src/pages/Mensagens.tsx`:

### 1. Layout em 2 colunas (mantido)
- Esquerda: lista de departamentos (Todos, Administrador, Gestor Operacional, Supervisor, Profissional de Campo, Financeiro/Medição, Auditor, Almoxarife/Estoque) — sem alteração.
- Direita: agora dividida verticalmente em **três áreas sempre visíveis**:
  - (a) Cabeçalho com chips dos destinatários selecionados.
  - (b) Lista de contatos do departamento filtrado, com checkbox para seleção múltipla. Botão "Selecionar todos do departamento" no topo.
  - (c) **Área de composição fixa no rodapé**: campo de texto + botão de microfone (gravar/parar) + preview do áudio gravado + botão Enviar. Sempre visível, mesmo quando a lista está vazia.

### 2. Suporte a múltiplos destinatários
- Estado `selectedContacts: Profile[]` (array) em vez de `selectedContact` único.
- Ao enviar, o sistema cria/recupera uma conversa para cada destinatário selecionado e insere a mensagem (texto e/ou áudio) em todas. Reaproveita `getOrCreateConversa`, `enviarDirect` e `enviarAudioDirect` em loop.
- Quando o usuário clica em um departamento e a lista está vazia, o aviso "Nenhum profissional cadastrado neste departamento ainda" aparece, **mas a área de composição continua disponível** (apenas o botão Enviar fica desabilitado até existir ao menos 1 destinatário).

### 3. Gravação de áudio dentro do pop-up
- Reutiliza `useAudioRecorder` já presente no arquivo.
- Botão de microfone alterna entre gravar/parar; áudio gravado aparece como `<audio controls>` com botão de descartar.
- Campo de texto e gravação podem ser usados em conjunto ou separadamente; Enviar fica habilitado se houver texto **ou** áudio **e** ao menos 1 destinatário.

### 4. Pós-envio
- Limpa texto, áudio e seleção de destinatários.
- Fecha o pop-up.
- Se houver apenas 1 destinatário, abre automaticamente a conversa criada (mantém `setActive(convId)`).
- Toast de confirmação ("Mensagem enviada para N destinatário(s)").

## Detalhes técnicos

- Arquivo único alterado: `src/pages/Mensagens.tsx`.
- Substituir `selectedContact` por `selectedContacts: Profile[]`; adicionar helpers `toggleContact`, `selectAllInDept`, `clearSelection`.
- Nova função `sendBroadcast()` que itera sobre `selectedContacts`, chama `getOrCreateConversa` para cada um e insere a mensagem (texto e/ou áudio). O upload do áudio é feito **uma vez** e o mesmo `publicUrl` é reutilizado em todas as inserções.
- Sem mudanças de banco de dados nem de RLS — as tabelas `conversations`, `conversation_participants` e `messages` já suportam esse fluxo.
- Sem novas dependências.

## Fora do escopo

- Criar conversas em grupo reais (uma única conversation com vários participantes). Para manter o histórico individual claro com cada pessoa, seguimos enviando uma cópia para cada destinatário (1‑a‑1). Pode ser evoluído depois caso deseje grupos verdadeiros.