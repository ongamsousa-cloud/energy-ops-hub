## Problema confirmado

O bloqueio não é só visual. Há três causas objetivas no projeto atual:

1. **Os destinatários por departamento ficam vazios**
   - A tela `src/pages/Mensagens.tsx` filtra contatos por `profiles.department_id`.
   - No banco, os usuários atuais estão com **`department_id = null`**, então ao clicar em departamentos como Operação/Financeiro a lista fica vazia.
   - Sem destinatário selecionável, o envio de texto e o microfone ficam inutilizáveis na prática.

2. **Os próximos usuários também cairiam no mesmo problema**
   - `src/pages/AprovacoesUsuarios.tsx` aprova usuário e define apenas a role.
   - `src/pages/Profissionais.tsx` também altera só a role.
   - Hoje não existe fluxo completo para salvar/editar o departamento no cadastro/aprovação.

3. **O áudio grava, mas o upload está inconsistente com o bucket**
   - `src/pages/Mensagens.tsx` envia áudio como `audio/webm`.
   - O bucket `os-evidences` está configurado para aceitar **imagem e vídeo**, mas **não áudio**.
   - Resultado: mesmo com gravação concluída, o envio do áudio pode falhar no armazenamento.

## O que vou implementar

### 1. Corrigir a base de departamentos e os usuários já existentes
- Criar uma migração para:
  - garantir que os departamentos usados pelo sistema existam;
  - preencher `profiles.department_id` dos usuários atuais com base na role/cargo atual;
  - incluir os setores que hoje faltam para refletir os usuários reais do sistema.

Mapeamento inicial previsto:
- `admin` → Administração
- `gestor`, `supervisor`, `campo` → Operação
- `financeiro` → Financeiro
- `auditor` → Auditoria
- `estoque` → Almoxarifado / Estoque

### 2. Fazer a tela de Mensagens funcionar mesmo quando o cadastro estiver incompleto
- Ajustar `src/pages/Mensagens.tsx` para:
  - carregar todos os profissionais ativos com join robusto de role + departamento;
  - exibir contatos por departamento com **fallback por role** se algum usuário ainda estiver sem `department_id`;
  - permitir seleção real de destinatários em todos os setores;
  - manter o composer utilizável e com estados mais claros.

### 3. Liberar envio de áudio de verdade
- Criar migração para permitir MIME types de áudio no bucket usado pelas mensagens.
- Ajustar o fluxo de gravação/envio em `src/pages/Mensagens.tsx` para:
  - usar formato compatível com mais navegadores (`webm` quando suportado, fallback quando necessário);
  - exibir erro claro de permissão/microfone;
  - garantir que o upload do áudio use um tipo aceito pelo armazenamento.

### 4. Preparar futuros usuários para aparecerem e se comunicarem corretamente
- Atualizar `src/pages/AprovacoesUsuarios.tsx` para aprovar usuário com:
  - role
  - departamento
  - cargo coerente, quando necessário
- Atualizar `src/pages/Profissionais.tsx` para permitir edição posterior de:
  - role
  - departamento
  - cargo

Assim, novos usuários já entram prontos para aparecer no setor correto e trocar mensagens com os demais.

### 5. Validar ponta a ponta
- Testar o fluxo autenticado com pelo menos estes cenários:
  - Administração → Operação: envio de texto
  - Operação → Financeiro: envio de texto
  - Operação → Operação: envio de áudio
  - aprovação de novo usuário e aparição imediata na lista de destinatários

## Arquivos e áreas que serão alterados

### Banco / backend
- nova migração para:
  - backfill de `profiles.department_id`
  - criação/ajuste dos departamentos faltantes
  - liberação de MIME types de áudio no bucket

### Frontend
- `src/pages/Mensagens.tsx`
- `src/pages/AprovacoesUsuarios.tsx`
- `src/pages/Profissionais.tsx`

## Resultado esperado

Depois dessa implementação:
- todos os setores cadastrados poderão se enxergar corretamente na tela de mensagens;
- será possível selecionar destinatários por departamento;
- o campo de mensagem deixará de ficar bloqueado por falta artificial de destinatários;
- o áudio poderá ser gravado e enviado;
- novos usuários aprovados também entrarão já habilitados para a comunicação.

## Detalhes técnicos

```text
Causa principal atual
Mensagens.tsx -> filtro por department_id
                  +
profiles sem department_id
                  =
lista vazia por setor
                  =
sem seleção de destinatário
                  =
envio "bloqueado"

Causa adicional do áudio
Mensagens.tsx envia audio/webm
                  +
bucket sem MIME de áudio
                  =
falha no upload
```

Se você aprovar, eu parto direto para a correção completa em código e banco, sem reduzir o escopo.