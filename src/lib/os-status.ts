export type OSStatus = 
  | 'pendente'
  | 'aguardando_aprovacao_departamento'
  | 'aguardando_liberacao_estoque'
  | 'material_liberado'
  | 'pronta_para_execucao'
  | 'iniciada'
  | 'em_deslocamento'
  | 'chegou_ao_local'
  | 'em_execucao'
  | 'aguardando_validacao_supervisor'
  | 'correcao_solicitada'
  | 'corrigida'
  | 'aprovada_supervisor'
  | 'aguardando_medicao'
  | 'medida'
  | 'aguardando_financeiro'
  | 'faturavel'
  | 'faturada'
  | 'aguardando_auditoria'
  | 'aprovada_auditoria'
  | 'reprovada_auditoria'
  | 'concluida'
  | 'cancelada';

export const OS_STATUS_FLOW: Record<OSStatus, { label: string; next?: OSStatus[] }> = {
  pendente: { label: "Pendente", next: ['aguardando_aprovacao_departamento', 'cancelada'] },
  aguardando_aprovacao_departamento: { label: "Aguard. Aprovação Depto", next: ['aguardando_liberacao_estoque', 'correcao_solicitada', 'cancelada'] },
  aguardando_liberacao_estoque: { label: "Aguard. Liberação Estoque", next: ['material_liberado', 'cancelada'] },
  material_liberado: { label: "Material Liberado", next: ['pronta_para_execucao', 'iniciada'] },
  pronta_para_execucao: { label: "Pronta p/ Execução", next: ['iniciada', 'em_deslocamento'] },
  iniciada: { label: "Iniciada", next: ['em_deslocamento', 'em_execucao'] },
  em_deslocamento: { label: "Em Deslocamento", next: ['chegou_ao_local'] },
  chegou_ao_local: { label: "Chegou ao Local", next: ['em_execucao'] },
  em_execucao: { label: "Em Execução", next: ['aguardando_validacao_supervisor'] },
  aguardando_validacao_supervisor: { label: "Aguard. Validação Supervisor", next: ['aprovada_supervisor', 'correcao_solicitada', 'reprovada_auditoria'] },
  correcao_solicitada: { label: "Correção Solicitada", next: ['corrigida', 'cancelada'] },
  corrigida: { label: "Corrigida", next: ['aguardando_validacao_supervisor'] },
  aprovada_supervisor: { label: "Aprovada Supervisor", next: ['aguardando_medicao', 'aguardando_auditoria'] },
  aguardando_medicao: { label: "Aguard. Medição", next: ['medida'] },
  medida: { label: "Medida", next: ['aguardando_financeiro'] },
  aguardando_financeiro: { label: "Aguard. Financeiro", next: ['faturavel'] },
  faturavel: { label: "Faturável", next: ['faturada'] },
  faturada: { label: "Faturada", next: ['aguardando_auditoria'] },
  aguardando_auditoria: { label: "Aguard. Auditoria", next: ['aprovada_auditoria', 'reprovada_auditoria'] },
  aprovada_auditoria: { label: "Aprovada Auditoria", next: ['concluida'] },
  reprovada_auditoria: { label: "Reprovada Auditoria", next: ['correcao_solicitada', 'cancelada'] },
  concluida: { label: "Concluída", next: [] },
  cancelada: { label: "Cancelada", next: [] }
};