
export function translateError(error: any): string {
  if (!error) return "Ocorreu um erro inesperado.";

  let message = typeof error === 'string' ? error : error.message || error.error_description || "";

  // Se a mensagem vier com prefixo "Erro ao salvar: ...", tenta extrair a parte técnica
  if (message.includes(": ")) {
    const parts = message.split(": ");
    const technicalPart = parts[parts.length - 1];
    if (technicalPart && technicalPart.length > 3) {
      // Se a parte técnica for traduzível, usamos a tradução dela
      const translatedPart = translateError(technicalPart);
      if (translatedPart !== technicalPart) {
        return translatedPart;
      }
    }
  }

  const msg = message.toLowerCase();

  // Mapeamento de erros comuns do Supabase/Auth/Postgres
  if (msg.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("email not confirmed")) return "Por favor, confirme seu e-mail antes de acessar.";
  if (msg.includes("user not found")) return "Usuário não encontrado.";
  if (msg.includes("jwt expired") || msg.includes("invalid ticket")) return "Sua sessão expirou. Por favor, faça login novamente.";
  if (msg.includes("violates foreign key constraint")) return "Este item não pode ser removido ou alterado pois está sendo usado em outra parte do sistema.";
  if (msg.includes("violates unique constraint")) return "Já existe um registro com estes dados. Verifique duplicidade.";
  if (msg.includes("null value in column") && msg.includes("violates not-null constraint")) return "Por favor, preencha todos os campos obrigatórios.";
  if (msg.includes("permission denied")) return "Você não tem permissão para realizar esta ação.";
  if (msg.includes("network error") || msg.includes("failed to fetch")) return "Erro de conexão. Verifique sua internet.";
  if (msg.includes("user_already_exists") || msg.includes("already registered")) return "Este e-mail já está cadastrado.";
  if (msg.includes("password is too short")) return "A senha deve ter pelo menos 6 caracteres.";
  if (msg.includes("database error")) return "Erro no banco de dados. Entre em contato com o suporte.";
  if (msg.includes("too many requests")) return "Muitas solicitações em pouco tempo. Tente novamente em alguns instantes.";
  if (msg.includes("rate limit")) return "Limite de taxa excedido. Aguarde um momento.";

  // Erros genéricos com prefixo
  if (msg.includes("error updating") || msg.includes("erro ao atualizar")) return "Não foi possível salvar as alterações.";
  if (msg.includes("error deleting") || msg.includes("erro ao excluir")) return "Não foi possível excluir o item.";
  if (msg.includes("error loading") || msg.includes("erro ao carregar")) return "Falha ao carregar os dados.";

  // Se não houver mapeamento, tenta limpar a mensagem técnica se ela for em inglês
  if (/^[a-zA-Z0-9_\s\-\.]+$/.test(message) && !message.includes(" ")) {
    // Provavelmente um código de erro técnico sem espaços
    return `Erro no sistema (${message}).`;
  }

  // Se for uma mensagem já em português (provavelmente manual), mantém
  const portugueseWords = ["erro", "falha", "obrigatório", "sucesso", "não", "para", "com", "sistema"];
  if (portugueseWords.some(word => msg.includes(word))) {
    return message;
  }

  // Fallback para uma mensagem amigável em português
  return "Ocorreu um problema ao processar sua solicitação. Tente novamente.";
}

/**
 * Helper para facilitar o uso direto no toast.error
 * Exemplo: toast.error(formatError(err, "Erro ao salvar material"));
 */
export function formatError(error: any, prefix?: string): string {
  const translated = translateError(error);
  if (prefix) {
    // Se o prefixo for em português, podemos manter
    return `${prefix}: ${translated}`;
  }
  return translated;
}