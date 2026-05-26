## Objetivo
Garantir acesso de login para todas as contas de teste com as senhas especificadas, ativando os perfis e atribuindo os papéis (roles) corretos.

## Contas a configurar

| Email | Senha | Papel |
|---|---|---|
| admin@teste.com | senha123! | admin |
| gestor@teste.com | senha123 | gestor |
| supervisor@teste.com | senha123 | supervisor |
| campo@teste.com | senha123 | campo |
| financeiro@teste.com | senha123 | financeiro |
| auditor@teste.com | senha123 | auditor |
| estoque@energyops.demo | Estoque@2026 | estoque (cargo Almoxarife) |

## Como será feito

1. **Atualizar a edge function `reset-test-passwords`** (já existe no projeto) para:
   - Criar o usuário no Auth se não existir (com `email_confirm: true`)
   - Atualizar a senha de cada conta usando `auth.admin.updateUserById`
   - Garantir registro em `profiles` com `ativo = true`, `must_change_password = false` e cargo apropriado (Almoxarife para a conta estoque)
   - Garantir entrada em `user_roles` com o papel correto (upsert)
2. **Invocar a edge function** uma vez para aplicar as mudanças.
3. **Ajustar o `src/pages/Login.tsx`**: a dica atual diz que a senha de todas é `Energy@2026!Ops`. Atualizar o aviso para refletir as novas credenciais (admin = `senha123!`, demais = `senha123`, estoque = `Estoque@2026`) e ajustar o `quickLogin`/`mockSignIn` para usar a senha correta por email em vez de uma senha fixa.
4. **Ajustar `mockSignIn` em `src/lib/auth.tsx`** para aceitar a senha como parâmetro (ou mapear por email) já que hoje está fixa em `Energy@2026!Ops`.

## Observações técnicas
- Nenhuma migração de schema é necessária — apenas dados (auth + profiles + user_roles).
- A conta `estoque@energyops.demo` precisa ter `cargo` contendo "almoxar" ou "estoque" para o flag `isEstoqueDept` funcionar e redirecionar para `/estoque-app`.
- Após executar, valido fazendo login manual com uma das contas para confirmar.
