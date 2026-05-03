
## Objetivo

Adicionar três fluxos faltantes ao sistema:

1. **Cadastro de novo usuário com aprovação do administrador**
2. **Reset de senha por email**
3. **Botão "Baixar aplicativo" (instalação PWA)**

---

## 1. Cadastro com aprovação do administrador

A tabela `profiles` já tem o campo `ativo` (boolean). Vamos usá-lo como flag de aprovação.

**Banco (migration)**:
- Alterar default de `profiles.ativo` para `false` (novos cadastros nascem pendentes).
- Atualizar a função `handle_new_user` para criar o perfil com `ativo = false` e **NÃO** atribuir role automaticamente (o admin define a role ao aprovar). Remover/ajustar `handle_new_user_role` para só inserir role se o admin já existir aprovando.
- Política RLS: admin pode listar/atualizar todos os perfis pendentes.

**Frontend**:
- `src/pages/Login.tsx`: já tem signup. Após cadastro, mostrar mensagem "Cadastro enviado. Aguarde aprovação do administrador." e bloquear login enquanto `ativo = false`.
- `src/lib/auth.tsx`: no `loadUserData`, se `profile.ativo === false`, fazer signOut e exibir aviso "Conta aguardando aprovação".
- Nova página `src/pages/AprovacoesUsuarios.tsx` (rota `/app/usuarios/aprovacoes`, role admin):
  - Lista perfis com `ativo = false`.
  - Botões "Aprovar" (define role escolhida via select + marca `ativo = true`) e "Rejeitar" (deleta o perfil).
- Adicionar item no menu lateral (`AppShell.tsx`) visível só para admin: "Aprovações de Usuários".

## 2. Reset de senha

**Frontend**:
- Em `src/pages/Login.tsx`: link "Esqueci minha senha" abre dialog para digitar email e chama `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`.
- Nova página pública `src/pages/ResetPassword.tsx` (rota `/reset-password`):
  - Detecta `type=recovery` no hash, mostra formulário de nova senha, chama `supabase.auth.updateUser({ password })` e redireciona para `/login`.
- Registrar a rota em `src/App.tsx` fora do `ProtectedRoute`.

Os emails de reset usarão o template padrão da Lovable Cloud (sem necessidade de domínio customizado).

## 3. Botão "Baixar aplicativo" (PWA)

O projeto já tem `public/manifest.webmanifest`, `public/sw.js` e `src/sw-register.ts` — está como PWA instalável.

**Frontend**:
- Novo componente `src/components/InstallAppButton.tsx`:
  - Captura o evento `beforeinstallprompt` e armazena.
  - Renderiza botão "Baixar aplicativo" que dispara o prompt nativo.
  - No iOS Safari (sem prompt), abre dialog explicando "Compartilhar → Adicionar à Tela de Início".
  - Esconde o botão se já estiver instalado (`display-mode: standalone`).
- Inserir o botão em:
  - `src/pages/Login.tsx` (rodapé, sempre visível).
  - `src/components/AppShell.tsx` (header, ícone de download).

## Resumo de arquivos

**Criar**
- `supabase/migrations/<timestamp>_user_approval.sql`
- `src/pages/ResetPassword.tsx`
- `src/pages/AprovacoesUsuarios.tsx`
- `src/components/InstallAppButton.tsx`

**Editar**
- `src/App.tsx` (rota `/reset-password` e `/app/usuarios/aprovacoes`)
- `src/pages/Login.tsx` (link esqueci senha + mensagem pós-cadastro + botão instalar)
- `src/lib/auth.tsx` (bloquear login de perfis não aprovados)
- `src/components/AppShell.tsx` (item de menu admin + botão instalar no header)
